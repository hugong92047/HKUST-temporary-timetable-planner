import os
import sys
from bs4 import BeautifulSoup
import json
import re

# --- CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "courses.js")

# List all your saved HTML files here
TARGET_FILES = [
    "ACCT.html", "AESF.html", "AIAA.html", "AISC.html", "AMAT.html", "AMCC.html", 
    "ARIN.html", "BEHI.html", "BIBU.html", "BIEN.html", "BSBE.html", "BTEC.html", 
    "CENG.html", "CHEM.html", "CHMS.html", "CIEM.html", "CIVL.html", "CMAA.html", 
    "COMP.html", "CPEG.html", "CSIT.html", "CTDL.html", "DASC.html", "DBAP.html", 
    "DRAP.html", "DSAA.html", "DSCT.html", "ECON.html", "EEMT.html", "EESM.html", 
    "ELEC.html", "EMIA.html", "ENEG.html", "ENGG.html", "ENTR.html", "ENVR.html", 
    "ENVS.html", "EOAS.html", "EVNG.html", "EVSM.html", "FINA.html", "FOFB.html", 
    "FTEC.html", "GBUS.html", "GNED.html", "HLTH.html", "HMAW.html", "HMMA.html", 
    "HUMA.html", "IBTM.html", "IEDA.html", "IIMP.html", "INTR.html", "IOTA.html", 
    "IPEN.html", "ISDN.html", "ISOM.html", "JEVE.html", "LABU.html", "LANG.html", 
    "LIFS.html", "MAED.html", "MAFS.html", "MAIE.html", "MARK.html", "MASS.html", 
    "MATH.html", "MCEE.html", "MECH.html", "MESF.html", "MFIT.html", "MGCS.html", 
    "MGMT.html", "MICS.html", "MILE.html", "MIMT.html", "MSBD.html", "MSDM.html", 
    "MSPY.html", "MTLE.html", "NANO.html", "OCES.html", "PDEV.html", "PHYS.html", 
    "PPOL.html", "RMBI.html", "ROAS.html", "SBMT.html", "SCIE.html", "SEEN.html", 
    "SGFN.html", "SHSS.html", "SMMG.html", "SOSC.html", "SUST.html", "TEMG.html", 
    "UCOP.html", "UGOD.html", "UPOP.html", "UROP.html", "UTOP.html", "WBBA.html"
]

def parse_time_string(time_str):
    if not time_str or time_str == "TBA": return None
    
    days_map = {'Mo':1, 'Tu':2, 'We':3, 'Th':4, 'Fr':5, 'Sa':6, 'Su':0}
    days = set()
    for d in ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']:
        if d in time_str:
            days.add(days_map[d])
            
    match = re.search(r'(\d{2}):(\d{2})(AM|PM)\s*-\s*(\d{2}):(\d{2})(AM|PM)', time_str)
    if not match: return None

    h1, m1, p1, h2, m2, p2 = match.groups()
    
    def to_24(h, m, p):
        h = int(h); m = int(m)
        if p == 'PM' and h != 12: h += 12
        if p == 'AM' and h == 12: h = 0
        return round(h + m/60.0, 2)

    return {"days": sorted(list(days)), "start": to_24(h1, m1, p1), "end": to_24(h2, m2, p2)}

def main():
    print(f"Running in: {SCRIPT_DIR}")
    print("-" * 40)
    
    all_data = []
    
    for filename in TARGET_FILES:
        filepath = os.path.join(SCRIPT_DIR, filename)
        
        if not os.path.exists(filepath):
            continue
            
        print(f"[READ] {filename}...", end="")
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')
                
            courses = []
            for div in soup.find_all('div', class_='course'):
                title = div.get_text(" ", strip=True)
                match = re.search(r'([A-Z]{4}\s\d{4}[A-Z]?)\s-\s(.*?)\s\((\d+)\sunit', title)
                if not match: continue
                
                code, title_clean, credits = match.groups()
                
                # --- NEW: ACCURATE EXCLUSION PARSING ---
                exclusions = []
                # Exclusions are stored in a table inside the 'courseattr' div
                attr_container = div.find('div', class_='courseattr')
                if attr_container:
                    attr_table = attr_container.find('table')
                    if attr_table:
                        for row in attr_table.find_all('tr'):
                            th = row.find('th')
                            td = row.find('td')
                            if th and "EXCLUSION" in th.get_text().upper():
                                # Extract all course codes like "FINA 3103" from the td text
                                exclusions = re.findall(r'[A-Z]{4}\s\d{4}[A-Z]?', td.get_text())
                
                # Check for matching requirement text anywhere in the course div
                text = div.get_text()
                pattern = r"Matching between Lecture & (Tutorial|Lab) required"
                has_matching = bool(re.search(pattern, text))
                
                # Find the sections table
                table = div.find_next('table', class_='sections')
                if not table: continue

                # GROUP BY SECTION ID
                sections_map = {} 
                current_section_id = None
                
                for row in table.find_all('tr'):
                    cols = row.find_all('td')
                    if len(cols) < 4: continue
                    
                    sec_id_raw = cols[0].get_text(strip=True)
                    if "Section" in sec_id_raw: continue 
                    
                    # If sec_id_raw is empty, it belongs to the previous section
                    if sec_id_raw:
                        current_section_id = sec_id_raw.split('(')[0].strip()
                    
                    if not current_section_id: continue

                    time_raw = cols[1].get_text(strip=True)
                    venue = cols[2].get_text(strip=True)
                    instructor = cols[3].get_text(strip=True)
                    
                    parsed = parse_time_string(time_raw)
                    if parsed:
                        slot = {
                            "time": time_raw, 
                            "venue": venue,
                            "instructor": instructor,
                            **parsed
                        }
                        
                        if current_section_id not in sections_map:
                            sections_map[current_section_id] = []
                        
                        sections_map[current_section_id].append(slot)
                
                # Convert map to list structure for JSON
                final_sections = []
                for sec_id, slots in sections_map.items():
                    final_sections.append({
                        "id": sec_id,
                        "slots": slots
                    })

                if final_sections:
                    courses.append({
                        "code": code, 
                        "title": title_clean,
                        "credits": int(credits), 
                        "matchingRequired": has_matching,
                        "exclusions": exclusions,
                        "sections": final_sections
                    })
            
            print(f" Found {len(courses)} courses.")
            all_data.extend(courses)
            
        except Exception as e:
            print(f" Error: {e}")

    if all_data:
        content = f"const courseData = {json.dumps(all_data, indent=4)};"
        with open(OUTPUT_FILE, "w", encoding='utf-8') as f:
            f.write(content)
        print("-" * 40)
        print(f"Success! Saved to: {OUTPUT_FILE}")
    else:
        print("\nNo data found.")

if __name__ == "__main__":
    main()
