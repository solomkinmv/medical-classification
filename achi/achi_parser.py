import csv
import dataclasses
import json
import re
from dataclasses import dataclass
from typing import List, Dict


SOURCE_CSV = '../data-source/nk-026-2021.csv'
PLACEHOLDER = '__'

# The source mixes look-alike Latin letters into Ukrainian words and a Cyrillic letter into two codes
LATIN_TO_CYRILLIC = str.maketrans('acexiopyABCEHIKMOPTX', 'асехіоруАВСЕНІКМОРТХ')
CYRILLIC_TO_LATIN = str.maketrans('асехіоруАВСЕНІКМОРТХ', 'acexiopyABCEHIKMOPTX')


def fix_mixed_script_words(text: str) -> str:
    return re.sub(r'[^\W\d_]+',
                  lambda m: m.group().translate(LATIN_TO_CYRILLIC)
                  if re.search('[\u0400-\u04FF]', m.group()) and re.search('[A-Za-z]', m.group()) else m.group(),
                  text)


def level_name(name: str) -> str:
    # Levels a row doesn't have are "__"; the "_" category is skipped by the bot's navigation
    return '_' if name == PLACEHOLDER else fix_mixed_script_words(name)


def level_code(code: str) -> str:
    return '' if code == PLACEHOLDER else code


class EnhancedJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if dataclasses.is_dataclass(o):
            return dataclasses.asdict(o)
        return super().default(o)


@dataclass
class RecordLevelFour:
    code: str
    name_ua: str
    name_en: str


@dataclass
class RecordLevelThree:
    code: str  # вісь блоків
    name_ua: str
    children: List[RecordLevelFour]

    def add(self, lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        self.children.append(RecordLevelFour(lvl_four_code, lvl_four_name_ua, lvl_four_name_en))


@dataclass
class RecordLevelTwo:
    code: str  # вісь процедурної типології
    name_ua: str
    children: Dict[str, RecordLevelThree]

    def add(self, lvl_three_code: str, lvl_three_name_ua: str,
            lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        key = lvl_three_name_ua
        # A few distinct blocks share a truncated name; keep their keys unique
        if key in self.children and self.children[key].code != lvl_three_code:
            key = f'{lvl_three_name_ua} ({lvl_three_code})'
        if key not in self.children:
            self.children[key] = RecordLevelThree(lvl_three_code, lvl_three_name_ua, [])
        self.children[key].add(lvl_four_code, lvl_four_name_ua, lvl_four_name_en)


@dataclass
class RecordLevelOne:
    code: str  # вісь анатомічної локалізації
    name_ua: str
    children: Dict[str, RecordLevelTwo]

    def add(self, lvl_two_code: str, lvl_two_name_ua: str, lvl_three_code: str, lvl_three_name_ua: str,
            lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        if lvl_two_name_ua not in self.children:
            self.children[lvl_two_name_ua] = RecordLevelTwo(lvl_two_code, lvl_two_name_ua, {})
        self.children[lvl_two_name_ua].add(lvl_three_code, lvl_three_name_ua, lvl_four_code, lvl_four_name_ua,
                                           lvl_four_name_en)


@dataclass
class RecordLevelZero:
    clazz: str  # клас
    name_ua: str
    children: Dict[str, RecordLevelOne]

    def add(self, lvl_one_code: str, lvl_one_name_ua: str,
            lvl_two_code: str, lvl_two_name_ua: str, lvl_three_code: str, lvl_three_name_ua: str,
            lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        if lvl_one_name_ua not in self.children:
            self.children[lvl_one_name_ua] = RecordLevelOne(lvl_one_code, lvl_one_name_ua, {})
        self.children[lvl_one_name_ua].add(lvl_two_code, lvl_two_name_ua, lvl_three_code, lvl_three_name_ua,
                                           lvl_four_code, lvl_four_name_ua, lvl_four_name_en)


@dataclass
class DataTree:
    children: Dict[str, RecordLevelZero]

    def add(self, lvl_zero_clazz: str, lvl_zero_name_ua: str, lvl_one_code: str, lvl_one_name_ua: str,
            lvl_two_code: str, lvl_two_name_ua: str, lvl_three_code: str, lvl_three_name_ua: str,
            lvl_four_code: str, lvl_four_name_ua: str, lvl_four_name_en: str):
        if lvl_zero_name_ua not in self.children:
            self.children[lvl_zero_name_ua] = RecordLevelZero(lvl_zero_clazz, lvl_zero_name_ua, {})
        self.children[lvl_zero_name_ua].add(lvl_one_code, lvl_one_name_ua, lvl_two_code, lvl_two_name_ua,
                                            lvl_three_code, lvl_three_name_ua, lvl_four_code, lvl_four_name_ua,
                                            lvl_four_name_en)


def parse_achi_file() -> DataTree:
    tree = DataTree({})
    with open(SOURCE_CSV, 'r', encoding='utf-8') as csv_file:
        reader = csv.reader(csv_file, delimiter=';')
        next(reader)

        for row in reader:
            if len(row) < 11:
                continue
            lvl_zero_clazz = row[0].strip()
            lvl_zero_name_ua = fix_mixed_script_words(row[1].strip()).capitalize()
            lvl_one_code = level_code(row[2].strip())
            lvl_one_name_ua = level_name(row[3].strip()).capitalize()
            lvl_two_code = level_code(row[4].strip())
            lvl_two_name_ua = level_name(row[5].strip()).capitalize()
            lvl_three_code = level_code(row[6].strip())
            lvl_three_name_ua = level_name(row[7].strip())
            lvl_four_code = row[8].strip().translate(CYRILLIC_TO_LATIN)
            lvl_four_name_ua = fix_mixed_script_words(row[9].strip())
            lvl_four_name_en = row[10].strip()
            tree.add(lvl_zero_clazz, lvl_zero_name_ua, lvl_one_code, lvl_one_name_ua, lvl_two_code, lvl_two_name_ua,
                     lvl_three_code, lvl_three_name_ua, lvl_four_code, lvl_four_name_ua, lvl_four_name_en)

    return tree


def write_data_to_json_file(tree: DataTree) -> None:
    json_object = json.dumps(tree, indent=4, ensure_ascii=False, cls=EnhancedJSONEncoder)

    with open("data/achi.json", "w") as outfile:
        outfile.write(json_object)


if __name__ == '__main__':
    data_tree = parse_achi_file()
    write_data_to_json_file(data_tree)
