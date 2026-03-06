import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "gym-record-app-v1";

const theme = {
  bg: "#f7f1ee",
  panel: "#fffaf8",
  pink: "#d8a7b1",
  beige: "#e8d9cf",
  beigeDark: "#d7c2b6",
  text: "#4f4a48",
  subtext: "#7a7270",
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

const isVisitedGym = (record) => {
  if (!record) return false;
  const hasMachine = exerciseDefs.some((item) => record[item.key]?.kg || record[item.key]?.reps);
  const hasTreadmill = record.treadmill?.incline || record.treadmill?.speed || record.treadmill?.distance;
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
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

function SectionTitle({ children }) {
  return <h2 className="section-title">{children}</h2>;
}

function NumberField({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      className="number-field"
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
        setRecords(JSON.parse(raw));
      } catch (error) {
        console.error("Failed to parse saved data", error);
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
      return {
        ...prev,
        [selectedDate]: updater(current),
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
    <div className="app-shell" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="app-grid">
        <div className="left-column">
          <div className="card" style={{ backgroundColor: theme.panel }}>
            <h1 className="app-title">ジムの記録アプリ</h1>
            <p className="app-subtitle">その日のトレーニングを、コツコツ記録。</p>
          </div>

          <div className="card" style={{ backgroundColor: theme.panel }}>
            <SectionTitle>トレッドミル累計</SectionTitle>
            <div className="summary-box" style={{ backgroundColor: theme.beige }}>
              <div className="summary-label">過去から現在までの総走行距離</div>
              <div className="summary-value">{treadmillTotal.toFixed(2)} km</div>
            </div>
            <button className="primary-button" onClick={resetTreadmillTotal}>
              総走行距離をリセット
            </button>
          </div>

          <div className="card" style={{ backgroundColor: theme.panel }}>
            <SectionTitle>月間カレンダー</SectionTitle>
            <div className="calendar-header">
              <button className="month-button" onClick={() => changeMonth(-1)}>◀</button>
              <div className="month-label">{monthLabel}</div>
              <button className="month-button" onClick={() => changeMonth(1)}>▶</button>
            </div>

            <div className="calendar-weekdays">
              {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="calendar-empty" />;

                const dateKey = formatDateKey(date);
                const record = records[dateKey];
                const visited = isVisitedGym(record);
                const isSelected = dateKey === selectedDate;
                const isToday = dateKey === todayKey;

                return (
                  <button
                    key={dateKey}
                    className={`calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                    onClick={() => setSelectedDate(dateKey)}
                  >
                    <span>{date.getDate()}</span>
                    {visited && <span className="flower">✿</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card" style={{ backgroundColor: theme.panel }}>
          <h2 className="record-title">{selectedDate} の記録</h2>
          <p className="record-subtitle">kg・回数・トレッドミルの内容を入力できます。</p>

          <div className="exercise-grid">
            {exerciseDefs.map((exercise) => (
              <div key={exercise.key} className="exercise-card">
                <div className="exercise-name">{exercise.label}</div>
                <div className="field-grid two-columns">
                  <div>
                    <label className="field-label">kg</label>
                    <NumberField
                      value={selectedRecord[exercise.key]?.kg || ""}
                      placeholder="例: 35"
                      onChange={(e) => updateMachine(exercise.key, "kg", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label">回数</label>
                    <NumberField
                      value={selectedRecord[exercise.key]?.reps || ""}
                      placeholder="例: 12"
                      onChange={(e) => updateMachine(exercise.key, "reps", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="exercise-card">
            <div className="exercise-name">トレッドミル</div>
            <div className="field-grid three-columns">
              <div>
                <label className="field-label">傾斜率</label>
                <NumberField
                  value={selectedRecord.treadmill?.incline || ""}
                  placeholder="例: 5"
                  onChange={(e) => updateTreadmill("incline", e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">平均速度</label>
                <NumberField
                  value={selectedRecord.treadmill?.speed || ""}
                  placeholder="例: 8.2"
                  onChange={(e) => updateTreadmill("speed", e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">走行距離 (km)</label>
                <NumberField
                  value={selectedRecord.treadmill?.distance || ""}
                  placeholder="例: 3.5"
                  onChange={(e) => updateTreadmill("distance", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="exercise-card">
            <label className="field-label strong-label">メモ</label>
            <textarea
              className="memo-field"
              value={selectedRecord.memo || ""}
              placeholder="今日の体調、気づいたこと、次回の目標など"
              onChange={(e) =>
                updateRecord((current) => ({
                  ...current,
                  memo: e.target.value,
                }))
              }
            />
          </div>

          <div className="bottom-row">
            <button className="secondary-button" onClick={clearSelectedDay}>
              この日の記録を削除
            </button>
            <div className="auto-save-text">入力内容はこのブラウザに自動保存されます。</div>
          </div>
        </div>
      </div>
    </div>
  );
}
