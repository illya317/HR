"use client";

import { useEffect, useState } from "react";

export interface Employee {
  id: number;
  employeeId: string;
  name: string;
  alias: string | null;
  gender: boolean | null;
  birthDate: string | null;
  ethnicity: string | null;
  hometown: string | null;
  politics: string | null;
  education: string | null;
  title: string | null;
  school: string | null;
  major: string | null;
  phone: string | null;
  workStartDate: string | null;
  idNumber: string | null;
  otherId: string | null;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  alias: string | null;
  company: string;
  level: number;
  levelLabel: string;
  parentId: number | null;
  parentName: string | null;
  managerUserId: number | null;
  managerName: string | null;
  headcount: number;
  children: { id: number; name: string }[];
}

export interface Position {
  id: number;
  code: string;
  codeRaw: string | null;
  name: string;
  alias: string | null;
  company: string;
  departmentId: number | null;
  departmentName: string | null;
  positionDescriptionId: number | null;
  positionDescriptionName: string | null;
  headcount: number;
}

export interface EDP {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentId: number | null;
  departmentName: string | null;
  positionId: number | null;
  positionName: string | null;
  isPrimary: boolean;
  startDate: string | null;
  endDate: string | null;
  personnelType: string | null;
  rank: string | null;
  title: string | null;
  reportTo: string | null;
  reportTo2: string | null;
  workPercent: number | null;
  isResearch: boolean | null;
}

export interface Employment {
  id: number;
  employeeId: number;
  employeeName: string;
  isActive: boolean;
  currentCompany: string | null;
  joinDate: string | null;
  leaveDate: string | null;
  leaveReason: string | null;
  officeLocation: string | null;
  attendanceType: string | null;
  contracts: any;
}

export interface AnalyticsData {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  edps: EDP[];
  employments: Employment[];
  loading: boolean;
  error: string | null;
}

export function useAnalyticsData() {
  const [data, setData] = useState<AnalyticsData>({
    employees: [],
    departments: [],
    positions: [],
    edps: [],
    employments: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const [empRes, deptRes, posRes, edpRes, emtRes] = await Promise.all([
          fetch("/api/hr/employees").then((r) => r.json()),
          fetch("/api/hr/departments").then((r) => r.json()),
          fetch("/api/hr/positions").then((r) => r.json()),
          fetch("/api/hr/edps").then((r) => r.json()),
          fetch("/api/hr/employments").then((r) => r.json()),
        ]);

        setData({
          employees: empRes.employees || [],
          departments: deptRes.departments || [],
          positions: posRes.positions || [],
          edps: edpRes.positions || [],
          employments: emtRes.items || [],
          loading: false,
          error: null,
        });
      } catch (err) {
        setData((prev) => ({ ...prev, loading: false, error: "数据加载失败" }));
      }
    }
    load();
  }, []);

  return data;
}
