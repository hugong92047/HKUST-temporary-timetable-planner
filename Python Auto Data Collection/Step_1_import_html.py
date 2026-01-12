import os
import requests
import time
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

# --- CONFIGURATION ---
TERM_CODE = '2530' # Spring 2025-26
BASE_URL = f"https://w5.ab.ust.hk/wcq/cgi-bin/{TERM_CODE}/subject/"
OUTPUT_FOLDER = "html_files"

# Full List of Subjects (Parsed from your string)
SUBJECTS = [
    'ACCT', 'AESF', 'AIAA', 'AISC', 'AMAT', 'AMCC', 'ARIN', 'BEHI', 'BIBU', 'BIEN', 
    'BSBE', 'BTEC', 'CENG', 'CHEM', 'CHMS', 'CIEM', 'CIVL', 'CMAA', 'COMP', 'CPEG', 
    'CSIT', 'CTDL', 'DASC', 'DBAP', 'DRAP', 'DSAA', 'DSCT', 'ECON', 'EEMT', 'EESM', 
    'ELEC', 'EMIA', 'ENEG', 'ENGG', 'ENTR', 'ENVR', 'ENVS', 'EOAS', 'EVNG', 'EVSM', 
    'FINA', 'FOFB', 'FTEC', 'GBUS', 'GNED', 'HLTH', 'HMAW', 'HMMA', 'HUMA', 'IBTM', 
    'IEDA', 'IIMP', 'INTR', 'IOTA', 'IPEN', 'ISDN', 'ISOM', 'JEVE', 'LABU', 'LANG', 
    'LIFS', 'MAED', 'MAFS', 'MAIE', 'MARK', 'MASS', 'MATH', 'MCEE', 'MECH', 'MESF', 
    'MFIT', 'MGCS', 'MGMT', 'MICS', 'MILE', 'MIMT', 'MSBD', 'MSDM', 'MSPY', 'MTLE', 
    'NANO', 'OCES', 'PDEV', 'PHYS', 'PPOL', 'RMBI', 'ROAS', 'SBMT', 'SCIE', 'SEEN', 
    'SGFN', 'SHSS', 'SMMG', 'SOSC', 'SUST', 'TEMG', 'UCOP', 'UGOD', 'UPOP', 'UROP', 
    'UTOP', 'WBBA'
]

# --- SSL FIX FOR LEGACY SERVERS ---
class LegacySSLAdapter(HTTPAdapter):
    """
    Forces Python to accept older SSL/TLS security levels used by some university servers.
    Fixes the 'SSLZeroReturnError'.
    """
    def init_poolmanager(self, *args, **kwargs):
        ctx = create_urllib3_context()
        ctx.load_default_certs()
        # "SECLEVEL=1" allows weaker keys/ciphers often found on older servers
        ctx.set_ciphers('DEFAULT@SECLEVEL=1')
        kwargs['ssl_context'] = ctx
        return super(LegacySSLAdapter, self).init_poolmanager(*args, **kwargs)

def main():
    # 1. Setup Output Folder
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)
        print(f"Created folder: {OUTPUT_FOLDER}")

    # 2. Configure Session (Browser Mimicking)
    session = requests.Session()
    session.mount('https://', LegacySSLAdapter()) # Apply the SSL fix
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://w5.ab.ust.hk/wcq/cgi-bin/'
    })

    print(f"Starting download for {len(SUBJECTS)} subjects...")
    print("-" * 50)

    # 3. Loop and Download
    for subject in SUBJECTS:
        url = f"{BASE_URL}{subject}"
        filepath = os.path.join(OUTPUT_FOLDER, f"{subject}.html")
        
        # Skip if already exists
        if os.path.exists(filepath):
            print(f"[SKIP] {subject} already exists.")
            continue

        print(f"[DOWNLOADING] {subject}...", end=" ", flush=True)
        
        try:
            response = session.get(url, timeout=20)
            
            if response.status_code == 200:
                with open(filepath, "w", encoding='utf-8') as f:
                    f.write(response.text)
                print("Success")
            elif response.status_code == 404:
                print("Not Found (404)")
            else:
                print(f"Failed ({response.status_code})")
                
        except Exception as e:
            print(f"Error: {str(e)}")

        # Sleep to avoid getting IP banned
        time.sleep(1)

    print("-" * 50)
    print(f"All downloads finished! Check the '{OUTPUT_FOLDER}' folder.")
    print("Run your parser script now to generate courses.js.")

if __name__ == "__main__":
    main()
