#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重新关联财务报表和工分明细 JSON（使用修复后的批号解析）。"""

import json
import re
import copy
import argparse

NORMALIZATION_MAP = {
    "盐酸左氧氟沙星胶囊": "盐酸氧氟沙星胶囊",
    "甘草酸二胺胶囊": "甘草酸二铵胶囊",
}


def normalize_name(name):
    if not name:
        return ""
    name = name.strip()
    for k, v in NORMALIZATION_MAP.items():
        name = name.replace(k, v)
    return name


def _parse_segment(start_num_str, seg):
    numbers = [int(start_num_str)]
    range_match = re.search(r"[-–—]\s*(\d+)", seg)
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
    m = re.match(r"(\d{8})(?:[-–—](\d+))?", seg)
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

    m = re.match(r"(\d+)(?:[-–—](\d+))?", seg)
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
    if not batch_str:
        return []
    m = re.search(r"批号[：:]?\s*(\d+)", batch_str)
    if not m:
        m = re.search(r"\b(\d{8,})\b", batch_str)
        if not m:
            return []
    full_num = m.group(1)
    if len(full_num) < 8:
        return []
    suffix = batch_str[m.end():]
    numbers = []
    segments = re.split(r"[/、]", suffix)
    first_seg = segments[0] if segments else ""
    numbers.extend(_parse_segment(full_num, first_seg))
    for seg in segments[1:]:
        seg = seg.strip()
        if seg:
            numbers.extend(_parse_standalone_segment(seg, full_num))
    return sorted(list(set(numbers)))


def relink(finance_json_path, work_json_path, out_linked_path):
    with open(finance_json_path, "r", encoding="utf-8") as f:
        finance = json.load(f)
    with open(work_json_path, "r", encoding="utf-8") as f:
        work = json.load(f)

    merged = copy.deepcopy(finance)
    for month_data in merged:
        month = month_data["月份"]
        wkey = f"{month}月"
        wproducts = work.get(wkey, [])

        fin_lookup = {}
        for prod in month_data["品种记录"]:
            norm = normalize_name(prod["品种"])
            if norm not in fin_lookup:
                fin_lookup[norm] = {}
            for batch in prod["批次记录"]:
                batch_nums = batch.get("批号列表") or []
                if not batch_nums and batch.get("批号") is not None:
                    try:
                        batch_nums = [int(batch["批号"])]
                    except (ValueError, TypeError):
                        batch_nums = parse_range_str(str(batch["批号"]))
                for bn in batch_nums:
                    fin_lookup[norm][int(bn)] = batch

        unmatched = []
        for wp in wproducts:
            wname = normalize_name(wp["品名"])
            wbatch_nums = parse_batch_numbers(wp.get("批号信息", ""))
            matched = False
            if wname in fin_lookup:
                if wbatch_nums:
                    for bn in wbatch_nums:
                        if bn in fin_lookup[wname]:
                            if "工分明细" not in fin_lookup[wname][bn]:
                                fin_lookup[wname][bn]["工分明细"] = []
                            fin_lookup[wname][bn]["工分明细"].append({
                                "品名": wp["品名"],
                                "批号信息": wp["批号信息"],
                                "人员工分明细": wp["人员工分明细"],
                            })
                            matched = True
                if not matched:
                    for bn, batch_rec in fin_lookup[wname].items():
                        if "工分明细" not in batch_rec:
                            batch_rec["工分明细"] = []
                        batch_rec["工分明细"].append({
                            "品名": wp["品名"],
                            "批号信息": wp["批号信息"],
                            "人员工分明细": wp["人员工分明细"],
                        })
                        matched = True
                        break
            if not matched:
                unmatched.append(wp)
        month_data["未匹配工分明细"] = unmatched

    with open(out_linked_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    total_batches = sum(
        len(p["批次记录"]) for m in merged for p in m.get("品种记录", [])
    )
    matched_batches = sum(
        1 for m in merged for p in m.get("品种记录", []) for b in p.get("批次记录", [])
        if "工分明细" in b
    )
    matched_people = sum(
        sum(len(wd["人员工分明细"]) for wd in b["工分明细"])
        for m in merged for p in m.get("品种记录", []) for b in p.get("批次记录", [])
        if "工分明细" in b
    )
    print(f"关联完成: {out_linked_path}")
    print(f"  总批次: {total_batches}, 已挂载: {matched_batches}, 匹配人次: {matched_people}")


def parse_range_str(text):
    if not text:
        return []
    text = str(text).strip()
    m = re.match(r"(\d{8})[-–—](\d{8})", text)
    if m:
        start = int(m.group(1))
        end = int(m.group(2))
        return list(range(start, end + 1))
    m = re.match(r"(\d{6})(\d{2})[-–—](\d{2,8})", text)
    if m:
        prefix = m.group(1)
        start_day = int(m.group(2))
        end_part = m.group(3)
        if len(end_part) == 2:
            end_day = int(end_part)
        else:
            end_day = int(end_part[-2:])
        return [int(prefix + f"{d:02d}") for d in range(start_day, end_day + 1)]
    m = re.match(r"(\d{8})", text)
    if m:
        return [int(m.group(1))]
    return []


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--finance-json", required=True)
    parser.add_argument("--work-json", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    relink(args.finance_json, args.work_json, args.out)
