#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""处理 2026 年车间报表，生成 JSON 和关联结果。"""

import json
import re
import copy
import pandas as pd

file = '/Users/koito/Desktop/.财务数据库/成本分析飞书实验版/2026年车间报表.xlsx'
base = '/Users/koito/Desktop/.财务数据库/成本分析飞书实验版'

def clean(val):
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        if pd.isna(val):
            return None
        return val
    s = str(val).strip()
    if s == 'nan' or s == '':
        return None
    return s

def try_num(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return val
    try:
        return float(val)
    except:
        return val

def normalize_name(name):
    if not name:
        return ''
    name = name.strip()
    name = name.replace('盐酸左氧氟沙星胶囊', '盐酸氧氟沙星胶囊')
    name = name.replace('甘草酸二胺胶囊', '甘草酸二铵胶囊')
    return name

def parse_range_str(text):
    """Parse batch range like '20260328-20260330' or '20260318-20' into list of ints."""
    if not text:
        return []
    text = str(text).strip()
    # Full range: 20260328-20260330
    m = re.match(r'(\d{8})[-–—](\d{8})', text)
    if m:
        start = int(m.group(1))
        end = int(m.group(2))
        return list(range(start, end + 1))
    # Short range: 20260318-20 or 20260318-20260320
    m = re.match(r'(\d{6})(\d{2})[-–—](\d{2,8})', text)
    if m:
        prefix = m.group(1)
        start_day = int(m.group(2))
        end_part = m.group(3)
        if len(end_part) == 2:
            end_day = int(end_part)
        else:
            end_day = int(end_part[-2:])
        return [int(prefix + f"{d:02d}") for d in range(start_day, end_day + 1)]
    # Single number
    m = re.match(r'(\d{8})', text)
    if m:
        return [int(m.group(1))]
    return []

def _parse_segment(start_num_str, seg):
    numbers = [int(start_num_str)]
    range_match = re.search(r'[-–—]\s*(\d+)', seg)
    if range_match:
        end_str = range_match.group(1)
        prefix_len = len(start_num_str) - len(end_str)
        if prefix_len > 0:
            end_num = int(start_num_str[:prefix_len] + end_str)
        else:
            end_num = int(end_str)
        start_num = int(start_num_str)
        if end_num > start_num:
            if str(start_num)[:6] == str(end_num)[:6]:
                for n in range(start_num + 1, end_num + 1):
                    numbers.append(n)
            else:
                numbers.append(end_num)
    return numbers


def _parse_standalone_segment(seg, reference_num):
    m = re.match(r'(\d{8})(?:[-–—](\d+))?', seg)
    if m:
        start = int(m.group(1))
        end_str = m.group(2)
        if end_str:
            prefix_len = 8 - len(end_str)
            if prefix_len > 0:
                end = int(str(start)[:prefix_len] + end_str)
            else:
                end = int(end_str)
            if end >= start:
                return list(range(start, end + 1))
        return [start]

    m = re.match(r'(\d+)(?:[-–—](\d+))?', seg)
    if m:
        short_start = m.group(1)
        short_end = m.group(2)
        prefix_len = len(reference_num) - len(short_start)
        if prefix_len > 0:
            start = int(reference_num[:prefix_len] + short_start)
        else:
            start = int(short_start)
        if short_end:
            end_prefix_len = len(reference_num) - len(short_end)
            if end_prefix_len > 0:
                end = int(reference_num[:end_prefix_len] + short_end)
            else:
                end = int(short_end)
            if end >= start:
                return list(range(start, end + 1))
        return [start]
    return []


def parse_batch_numbers(batch_str):
    """Extract batch numbers from work detail string. Supports / and 、 separators."""
    if not batch_str:
        return []
    m = re.search(r'批号[：:]?\s*(\d+)', batch_str)
    if not m:
        m = re.search(r'\b(\d{8,})\b', batch_str)
        if not m:
            return []
    full_num = m.group(1)
    if len(full_num) < 8:
        return []
    suffix = batch_str[m.end():]
    numbers = []
    segments = re.split(r'[/、]', suffix)
    first_seg = segments[0] if segments else ''
    numbers.extend(_parse_segment(full_num, first_seg))
    for seg in segments[1:]:
        seg = seg.strip()
        if seg:
            numbers.extend(_parse_standalone_segment(seg, full_num))
    return sorted(list(set(numbers)))

xl = pd.ExcelFile(file)

# ===== Parse Finance Report =====
df_fin = pd.read_excel(file, sheet_name='2026年财务报表', header=None)
months = []
i = 0
while i < len(df_fin):
    row = df_fin.iloc[i]
    title = clean(row[0])
    if title and isinstance(title, str) and re.match(r'2026年\d{2}月片剂车间生产品种入库报表', title):
        month_match = re.search(r'(\d{2})月', title)
        month_num = int(month_match.group(1)) if month_match else None
        i += 1
        if i < len(df_fin):
            i += 1  # skip header
        else:
            break
        records = []
        current_product = None
        while i < len(df_fin):
            r = df_fin.iloc[i]
            first = clean(r[0])
            if first == '合   计' or (isinstance(first, str) and '合计' in first):
                totals = {
                    "投料量_万粒": try_num(clean(r[4])),
                    "工分": try_num(clean(r[5])),
                    "生产数量": clean(r[6]),
                    "折合_盒瓶": try_num(clean(r[7])),
                    "折合_万粒": try_num(clean(r[8])),
                }
                i += 1
                while i < len(df_fin):
                    fc = clean(df_fin.iloc[i][0])
                    if fc and isinstance(fc, str) and ('制表' in fc or '复核' in fc or '制 表' in fc):
                        i += 1
                    else:
                        break
                months.append({
                    "月份": month_num,
                    "报表标题": title,
                    "品种记录": records,
                    "合计": totals
                })
                break
            if first and isinstance(first, str) and re.match(r'2026年\d{2}月', first):
                break
            seq = clean(r[0])
            name = clean(r[1])
            spec = clean(r[2])
            batch_raw = clean(r[3])
            if seq is not None and (isinstance(seq, int) or (isinstance(seq, str) and seq.isdigit())):
                current_product = {
                    "序号": int(seq) if isinstance(seq, str) else seq,
                    "品种": name,
                    "规格": spec,
                    "批次记录": []
                }
                records.append(current_product)
            if current_product is None and name and not batch_raw:
                current_product = {
                    "序号": None,
                    "品种": name,
                    "规格": spec,
                    "批次记录": []
                }
                records.append(current_product)
            if current_product:
                batch_nums = parse_range_str(batch_raw)
                batch_record = {
                    "批号": batch_raw if not batch_nums else (batch_nums[0] if len(batch_nums) == 1 else batch_raw),
                    "批号列表": batch_nums if len(batch_nums) > 1 else None,
                    "投料量_万粒": try_num(clean(r[4])),
                    "工分": try_num(clean(r[5])),
                    "生产数量": clean(r[6]),
                    "折合_盒瓶": try_num(clean(r[7])),
                    "折合_万粒": try_num(clean(r[8])),
                    "备注": clean(r[9])
                }
                batch_record = {k: v for k, v in batch_record.items() if v is not None}
                if batch_record:
                    current_product["批次记录"].append(batch_record)
            i += 1
    else:
        i += 1

with open(f'{base}/2026年车间报表_财务报表.json', 'w', encoding='utf-8') as f:
    json.dump(months, f, ensure_ascii=False, indent=2)

# ===== Parse Workpoint Details =====
all_workpoint = {}
for sheet_name in xl.sheet_names:
    if not sheet_name.endswith('工分明细'):
        continue
    month_match = re.search(r'(\d+)月', sheet_name)
    month_num = int(month_match.group(1)) if month_match else None
    df = pd.read_excel(file, sheet_name=sheet_name, header=None)
    products = []
    i = 0
    while i < len(df):
        row0 = clean(df.iloc[i][0])
        if row0 and isinstance(row0, str) and '固体制剂车间入库品种工分明细' in row0:
            title = row0
            i += 1
            if i >= len(df):
                break
            row1_0 = clean(df.iloc[i][0])
            row1_3 = clean(df.iloc[i][3])
            product_name = None
            batch_info = None
            if row1_0 and isinstance(row1_0, str):
                if row1_0.startswith('品名：') or row1_0.startswith('品名:'):
                    product_name = re.sub(r'^品名[：:]', '', row1_0).strip()
            if row1_3 and isinstance(row1_3, str) and '批号' in row1_3:
                batch_info = row1_3.strip()
            i += 1
            if i < len(df):
                i += 1
            entries = []
            current_position = None
            while i < len(df):
                r = df.iloc[i]
                c0 = clean(r[0])
                c1 = clean(r[1])
                c2 = clean(r[2])
                total_val = clean(r[10]) if len(r) > 10 else None
                if c0 is None and c1 is None and c2 is None and total_val is not None:
                    try:
                        float(total_val)
                        i += 1
                        break
                    except:
                        pass
                if c0 and isinstance(c0, str) and '固体制剂车间入库品种工分明细' in c0:
                    break
                if c0 and isinstance(c0, str) and (c0.startswith('品名：') or c0.startswith('品名:')):
                    break
                if c0 is not None and isinstance(c0, str) and c0.strip() != '':
                    current_position = c0.strip()
                name = c2
                if name is None:
                    i += 1
                    continue
                position_unit_price = try_num(c1)
                daily_scores = []
                for col_idx in range(3, 9):
                    v = clean(r[col_idx]) if col_idx < len(r) else None
                    if v is not None:
                        daily_scores.append(try_num(v))
                remark = clean(r[9]) if len(r) > 9 else None
                total = try_num(clean(r[10])) if len(r) > 10 else None
                entry = {
                    "岗位类别": current_position,
                    "姓名": name,
                    "岗位工分单价": position_unit_price,
                    "每日工分": daily_scores,
                    "备注": remark,
                    "合计": total
                }
                entry = {k: v for k, v in entry.items() if v is not None}
                if entry:
                    entries.append(entry)
                i += 1
            products.append({
                "品名": product_name,
                "批号信息": batch_info,
                "人员工分明细": entries
            })
        else:
            i += 1
    all_workpoint[f"{month_num}月"] = products

with open(f'{base}/2026年车间报表_工分明细.json', 'w', encoding='utf-8') as f:
    json.dump(all_workpoint, f, ensure_ascii=False, indent=2)

# ===== Merge =====
merged = copy.deepcopy(months)
for month_data in merged:
    month = month_data['月份']
    wkey = f"{month}月"
    wproducts = all_workpoint.get(wkey, [])
    fin_lookup = {}
    for prod in month_data['品种记录']:
        norm = normalize_name(prod['品种'])
        if norm not in fin_lookup:
            fin_lookup[norm] = {}
        for batch in prod['批次记录']:
            batch_nums = batch.get('批号列表') or []
            if not batch_nums and batch.get('批号') is not None:
                try:
                    batch_nums = [int(batch['批号'])]
                except (ValueError, TypeError):
                    batch_nums = parse_range_str(str(batch['批号']))
            for bn in batch_nums:
                fin_lookup[norm][int(bn)] = batch
    unmatched = []
    for wp in wproducts:
        wname = normalize_name(wp['品名'])
        wbatch_nums = parse_batch_numbers(wp.get('批号信息', ''))
        matched = False
        if wname in fin_lookup:
            if wbatch_nums:
                for bn in wbatch_nums:
                    if bn in fin_lookup[wname]:
                        if '工分明细' not in fin_lookup[wname][bn]:
                            fin_lookup[wname][bn]['工分明细'] = []
                        fin_lookup[wname][bn]['工分明细'].append({
                            "品名": wp['品名'],
                            "批号信息": wp['批号信息'],
                            "人员工分明细": wp['人员工分明细']
                        })
                        matched = True
                        break
            if not matched:
                for bn, batch_rec in fin_lookup[wname].items():
                    if '工分明细' not in batch_rec:
                        batch_rec['工分明细'] = []
                    batch_rec['工分明细'].append({
                        "品名": wp['品名'],
                        "批号信息": wp['批号信息'],
                        "人员工分明细": wp['人员工分明细']
                    })
                    matched = True
                    break
        if not matched:
            unmatched.append(wp)
    month_data['未匹配工分明细'] = unmatched

with open(f'{base}/2026年车间报表_关联.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

# Stats
total_batches = 0
matched_batches = 0
total_wp = 0
matched_wp = 0
for m in merged:
    for p in m['品种记录']:
        for b in p['批次记录']:
            total_batches += 1
            if '工分明细' in b:
                matched_batches += 1
                total_wp += len(b['工分明细'])
                matched_wp += sum(len(w['人员工分明细']) for w in b['工分明细'])
    total_wp += len(m.get('未匹配工分明细', []))

print("=== 2026年处理完成 ===")
print(f"财务月份数: {len(months)}")
print(f"总批次记录: {total_batches}")
print(f"关联到工分明细的批次: {matched_batches}")
print(f"工分明细总条目数: {total_wp}")
print(f"已匹配人员人次: {matched_wp}")
print(f"未匹配工分明细条目: {sum(len(m.get('未匹配工分明细',[])) for m in merged)}")
for m in merged:
    um = m.get('未匹配工分明细', [])
    if um:
        print(f"  {m['月份']}月 未匹配:")
        for u in um:
            print(f"    - {u['品名']} | {u['批号信息']} | {len(u['人员工分明细'])}人")
