import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Dumbbell, RotateCcw, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const STORAGE_KEY = "gym-record-app-v1";

const theme = {
  bg: "#f7f1ee",
  panel: "#fffaf8",
  pink: "#d8a7b1",
  beige: "#e8d9cf",
  beigeDark: "#d7c2b6",
  text: "#4f4a48",
  subtext: "#7a7270",
  accent: "#c98f9c",
};

const exerciseDefs = [
  { key: "legPress", label: "レッグプレス" },
  { key: "torsoRotation", label: "トーソローテーション" },
  { key: "hipAbduction", label: "ヒップアブダクター/アブダクション" },
  { key: "abdominal", label: "アブドミナル" },
  { key: "chestPress", label: "チェストプレス" },
];

const emptyMachine = { kg: "", reps: "" };
const emptyTreadmill = { incline: "", speed: "", distance: "" };

const createEmptyRecord = () => ({
  memo: "",
  legPress: { ...emptyMachine },
  torsoRotation: { ...emptyMachine },
  hipAbduction: { ...emptyMachine },
  abdominal: { ...emptyMachine },
  chestPress: { ...emptyMachine },
  treadmill: { ...emptyTreadmill },
});

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateKey = (dateKey) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const isVisitedGym = (record) => {
  if (!record) return false;
  const hasMachine = exerciseDefs.some((item) => record[item.key]?.kg || record[item.key]?.reps);
  const hasTreadmill =
    record.treadmill?.incline || record.treadmill?.speed || record.treadmill?.distance;
  const hasMemo = Boolean(record.memo?.trim());
  return hasMachine || hasTreadmill || hasMemo;
};

const buildCalendarDays = (viewDate) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="p-2 rounded-2xl"
        style={{ backgroundColor: theme.beige }}
      >
        <Icon size={18} style={{ color: theme.text }} />
      </div>
      <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
        {children}
      </h2>
    </div>
  );
}

function NumberField({ id, value, onChange, placeholder }) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      className="rounded-2xl border-0 shadow-sm"
      style={{
        backgroundColor: theme.panel,
        color: theme.text,
      }}
    />
  );
}

export default function GymRecordApp() {
  const todayKey = formatDateKey(new Date());
  const [records, setRecords] = useState({});
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setRecords(parsed);
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const selectedRecord = records[selectedDate] || createEmptyRecord();

  const treadmillTotal = useMemo(() => {
    return Object.values(records).reduce((sum, record) => {
      const value = parseFloat(record?.treadmill?.distance || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [records]);

  const monthLabel = `${viewMonth.getFullYear()}年${viewMonth.getMonth() + 1}月`;
  const calendarDays = buildCalendarDays(viewMonth);

  const updateRecord = (updater) => {
    setRecords((prev) => {
      const current = prev[selectedDate] || createEmptyRecord();
      const nextRecord = updater(current);
      return {
        ...prev,
        [selectedDate]: nextRecord,
      };
    });
  };

  const updateMachine = (machineKey, field, value) => {
    updateRecord((current) => ({
      ...current,
      [machineKey]: {
        ...current[machineKey],
        [field]: value,
      },
    }));
  };

  const updateTreadmill = (field, value) => {
    updateRecord((current) => ({
      ...current,
      treadmill: {
        ...current.treadmill,
        [field]: value,
      },
    }));
  };

  const changeMonth = (diff) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + diff, 1));
  };

  const resetTreadmillTotal = () => {
    const ok = window.confirm("トレッドミルの総走行距離をリセットしますか？");
    if (!ok) return;

    setRecords((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((dateKey) => {
        next[dateKey] = {
          ...next[dateKey],
          treadmill: {
            ...next[dateKey].treadmill,
            distance: "",
          },
        };
      });
      return next;
    });
  };

  const clearSelectedDay = () => {
    const ok = window.confirm(`${selectedDate} の記録を消しますか？`);
    if (!ok) return;
    setRecords((prev) => {
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
  };

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-1 space-y-6"
        >
          <Card
            className="border-0 rounded-[28px] shadow-md"
            style={{ backgroundColor: theme.panel }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: theme.text }}>
                <div
                  className="p-3 rounded-2xl"
                  style={{ backgroundColor: theme.beige }}
                >
                  <Dumbbell size={22} />
                </div>
                ジムの記録アプリ
              </CardTitle>
              <p style={{ color: theme.subtext }}>
                その日のトレーニングを、コツコツ記録。
              </p>
            </CardHeader>
          </Card>

          <Card
            className="border-0 rounded-[28px] shadow-md"
            style={{ backgroundColor: theme.panel }}
          >
            <CardContent className="pt-6">
              <SectionTitle icon={Activity}>トレッドミル累計</SectionTitle>
              <div
                className="rounded-3xl p-5 shadow-sm"
                style={{ backgroundColor: theme.beige }}
              >
                <div className="text-sm mb-2" style={{ color: theme.subtext }}>
                  過去から現在までの総走行距離
                </div>
                <div className="text-4xl font-bold tracking-tight" style={{ color: theme.text }}>
                  {treadmillTotal.toFixed(2)} km
                </div>
              </div>

              <Button
                onClick={resetTreadmillTotal}
                className="mt-4 w-full rounded-2xl"
                style={{ backgroundColor: theme.pink, color: "white" }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                総走行距離をリセット
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-0 rounded-[28px] shadow-md"
            style={{ backgroundColor: theme.panel }}
          >
            <CardContent className="pt-6">
              <SectionTitle icon={Calendar}>月間カレンダー</SectionTitle>

              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => changeMonth(-1)}
                  className="rounded-2xl"
                  style={{ backgroundColor: theme.beige }}
                >
                  <ChevronLeft size={18} />
                </Button>
                <div className="font-semibold text-lg">{monthLabel}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => changeMonth(1)}
                  className="rounded-2xl"
                  style={{ backgroundColor: theme.beige }}
                >
                  <ChevronRight size={18} />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center mb-2 text-sm" style={{ color: theme.subtext }}>
                {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                  <div key={day} className="font-medium py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dateKey = formatDateKey(date);
                  const isSelected = dateKey === selectedDate;
                  const record = records[dateKey];
                  const visited = isVisitedGym(record);
                  const isToday = dateKey === todayKey;

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(dateKey)}
                      className="aspect-square rounded-2xl p-2 text-sm transition shadow-sm relative"
                      style={{
                        backgroundColor: isSelected ? theme.pink : theme.bg,
                        color: isSelected ? "white" : theme.text,
                        border: isToday ? `2px solid ${theme.beigeDark}` : "2px solid transparent",
                      }}
                    >
                      <div className="font-medium">{date.getDate()}</div>
                      {visited && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs">
                          ✿
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="xl:col-span-2"
        >
          <Card
            className="border-0 rounded-[28px] shadow-md"
            style={{ backgroundColor: theme.panel }}
          >
            <CardHeader>
              <CardTitle className="text-2xl" style={{ color: theme.text }}>
                {selectedDate} の記録
              </CardTitle>
              <p style={{ color: theme.subtext }}>
                kg・回数・トレッドミルの内容を入力できます。
              </p>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exerciseDefs.map((exercise) => (
                  <div
                    key={exercise.key}
                    className="rounded-3xl p-5 shadow-sm"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <div className="font-semibold mb-4" style={{ color: theme.text }}>
                      {exercise.label}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`${exercise.key}-kg`} className="mb-2 block" style={{ color: theme.subtext }}>
                          kg
                        </Label>
                        <NumberField
                          id={`${exercise.key}-kg`}
                          value={selectedRecord[exercise.key]?.kg || ""}
                          placeholder="例: 35"
                          onChange={(e) => updateMachine(exercise.key, "kg", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${exercise.key}-reps`} className="mb-2 block" style={{ color: theme.subtext }}>
                          回数
                        </Label>
                        <NumberField
                          id={`${exercise.key}-reps`}
                          value={selectedRecord[exercise.key]?.reps || ""}
                          placeholder="例: 12"
                          onChange={(e) => updateMachine(exercise.key, "reps", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="rounded-3xl p-5 shadow-sm"
                style={{ backgroundColor: theme.bg }}
              >
                <div className="font-semibold mb-4" style={{ color: theme.text }}>
                  トレッドミル
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="treadmill-incline" className="mb-2 block" style={{ color: theme.subtext }}>
                      傾斜率
                    </Label>
                    <NumberField
                      id="treadmill-incline"
                      value={selectedRecord.treadmill?.incline || ""}
                      placeholder="例: 5"
                      onChange={(e) => updateTreadmill("incline", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="treadmill-speed" className="mb-2 block" style={{ color: theme.subtext }}>
                      平均速度
                    </Label>
                    <NumberField
                      id="treadmill-speed"
                      value={selectedRecord.treadmill?.speed || ""}
                      placeholder="例: 8.2"
                      onChange={(e) => updateTreadmill("speed", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="treadmill-distance" className="mb-2 block" style={{ color: theme.subtext }}>
                      走行距離 (km)
                    </Label>
                    <NumberField
                      id="treadmill-distance"
                      value={selectedRecord.treadmill?.distance || ""}
                      placeholder="例: 3.5"
                      onChange={(e) => updateTreadmill("distance", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div
                className="rounded-3xl p-5 shadow-sm"
                style={{ backgroundColor: theme.bg }}
              >
                <Label htmlFor="memo" className="mb-2 block font-semibold" style={{ color: theme.text }}>
                  メモ
                </Label>
                <Textarea
                  id="memo"
                  value={selectedRecord.memo || ""}
                  placeholder="今日の体調、気づいたこと、次回の目標など"
                  onChange={(e) =>
                    updateRecord((current) => ({
                      ...current,
                      memo: e.target.value,
                    }))
                  }
                  className="min-h-[120px] rounded-2xl border-0 shadow-sm"
                  style={{ backgroundColor: theme.panel, color: theme.text }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={clearSelectedDay}
                  variant="outline"
                  className="rounded-2xl"
                  style={{ borderColor: theme.beigeDark, color: theme.text }}
                >
                  この日の記録を削除
                </Button>
                <div className="text-sm flex items-center" style={{ color: theme.subtext }}>
                  入力内容はこのブラウザに自動保存されます。
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}


