from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def parse_float(text: str):
    """Zamienia string '44,05' lub '44.05' na float, zwraca None jeśli nie da rady."""
    if not text:
        return None
    cleaned = text.strip().replace(" ", "").replace("\xa0", "").replace("%", "")
    cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


@app.get("/metrics")
async def get_metrics(symbol: str):
    symbol = symbol.upper()
    url = f"https://www.bankier.pl/inwestowanie/profile/quote.html?symbol={symbol}"

    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15) as client:
        r = await client.get(url)

    if r.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Spółka '{symbol}' nie znaleziona")
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Bankier zwrócił {r.status_code}")

    soup = BeautifulSoup(r.text, "html.parser")

    # Zbieramy wszystkie wiersze ze wszystkich tabel -> słownik label: value
    raw = {}
    for table in soup.find_all("table"):
        for row in table.find_all("tr"):
            cells = row.find_all(["td", "th"])
            if len(cells) >= 2:
                # Pierwszy <span> w komórce to czysty label (bez tooltip tekstu)
                first_span = cells[0].find("span")
                label = first_span.get_text(strip=True) if first_span else cells[0].get_text(strip=True)
                value = cells[1].get_text(strip=True)
                if label and value:
                    raw[label] = value

    # Mapowanie na pola których oczekuje frontend
    # C/Z = P/E
    pe_raw = raw.get("C / Z") or raw.get("C/Z") or raw.get("C / Z ")
    # C/WK = P/BV
    cwk_raw = raw.get("C / WK") or raw.get("C/WK")
    # ROE
    roe_raw = raw.get("ROE")
    # Marża netto
    marza_raw = raw.get("Marża netto")
    # Stopa dywidendy
    dywidenda_raw = raw.get("Stopa dywid.") or raw.get("Stopa dywidendy")

    # Wyniki finansowe (ostatni kwartał) — do liczenia wskaźników płynności
    # Bankier nie podaje bezpośrednio current_ratio / quick_ratio / debt_ratio na tej stronie,
    # więc zwracamy None dla tych pól — można je dodać później ze strony wyników finansowych
    return {
        "symbol": symbol,
        "pe": parse_float(pe_raw),           # C/Z
        "pbv": parse_float(cwk_raw),         # C/WK  
        "roe": parse_float(roe_raw),         # ROE %
        "net_margin": parse_float(marza_raw),# Marża netto %
        "dividend_yield": parse_float(dywidenda_raw),  # Stopa dywidendy %
        # Pola których Bankier nie ma na tej stronie — na razie null
        "ev_ebitda": None,
        "debt_ratio": None,
        "current_ratio": None,
        "quick_ratio": None,
        "receivables_to_liabilities": None,
        "golden_rule": None,
        "silver_rule": None,
        # Raw data do debugowania
        "_raw": raw,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}