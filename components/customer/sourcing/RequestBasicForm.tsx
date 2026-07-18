"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type BiddingForm = {
  projectName: string;
  bidDeadline: string;
  dueDate: string;
  minimumPartnerTier: string;
  description: string;
  memo: string;
};

type RequestBasicFormProps = {
  form: BiddingForm;
  disabled?: boolean;

  onChange: (
    field: keyof BiddingForm,
    value: string,
  ) => void;
};

type DatePickerProps = {
  id: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  minDate?: string;

  onChange: (value: string) => void;
};

type CalendarDay = {
  date: Date;
  dateKey: string;
  day: number;
  isCurrentMonth: boolean;
};

const WEEK_DAY_LABELS = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
];

const TIME_OPTIONS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

function parseDateValue(
  value: string,
): Date | null {
  if (!value) {
    return null;
  }

  const dateValue =
    value.split("T")[0];

  const [year, month, day] =
    dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day,
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date;
}

function formatDateLabel(
  value: string,
) {
  const date = parseDateValue(value);

  if (!date) {
    return "";
  }

  const weekDay =
    WEEK_DAY_LABELS[
      date.getDay()
    ];

  return [
    date.getFullYear(),
    padNumber(
      date.getMonth() + 1,
    ),
    padNumber(date.getDate()),
  ].join(".") + ` (${weekDay})`;
}

function createCalendarDays(
  visibleMonth: Date,
): CalendarDay[] {
  const year =
    visibleMonth.getFullYear();

  const month =
    visibleMonth.getMonth();

  const firstDate =
    new Date(year, month, 1);

  const startDate = new Date(
    year,
    month,
    1 - firstDate.getDay(),
  );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const date = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() +
          index,
      );

      return {
        date,
        dateKey:
          toDateKey(date),
        day: date.getDate(),
        isCurrentMonth:
          date.getMonth() ===
          month,
      };
    },
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3v3m10-3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m6 9 6 6 6-6"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m15 18-6-6 6-6"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 18 6-6-6-6"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7.5V12l3 2"
      />
    </svg>
  );
}

function DatePicker({
  id,
  value,
  placeholder,
  disabled = false,
  minDate,
  onChange,
}: DatePickerProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(
    () => parseDateValue(value),
    [value],
  );

  const [isOpen, setIsOpen] =
    useState(false);

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(() => {
    const initialDate =
      parseDateValue(value) ??
      new Date();

    return new Date(
      initialDate.getFullYear(),
      initialDate.getMonth(),
      1,
    );
  });

  const calendarDays = useMemo(
    () =>
      createCalendarDays(
        visibleMonth,
      ),
    [visibleMonth],
  );

  const selectedDateKey =
    selectedDate
      ? toDateKey(selectedDate)
      : "";

  const todayKey = toDateKey(
    new Date(),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleMouseDown = (
      event: MouseEvent,
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape"
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleMouseDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setVisibleMonth(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1,
      ),
    );
  }, [
    selectedDateKey,
  ]);

  const moveMonth = (
    amount: number,
  ) => {
    setVisibleMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() +
            amount,
          1,
        ),
    );
  };

  const handleSelectDate = (
    dateKey: string,
  ) => {
    onChange(dateKey);
    setIsOpen(false);
  };

  const isDateDisabled = (
    dateKey: string,
  ) => {
    if (!minDate) {
      return false;
    }

    return dateKey < minDate;
  };

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() =>
          setIsOpen(
            (previous) =>
              !previous,
          )
        }
        className={[
          "flex h-11 w-full items-center gap-3 rounded-md border bg-white px-3.5 text-left transition",
          "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
          isOpen
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-slate-300 hover:border-slate-400",
        ].join(" ")}
      >
        <span
          className={
            isOpen
              ? "text-blue-600"
              : "text-slate-500"
          }
        >
          <CalendarIcon />
        </span>

        <span
          className={[
            "min-w-0 flex-1 truncate text-[13px]",
            value
              ? "font-medium text-slate-900"
              : "text-slate-400",
          ].join(" ")}
        >
          {value
            ? formatDateLabel(
                value,
              )
            : placeholder}
        </span>

        <span className="text-slate-400">
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <button
              type="button"
              onClick={() =>
                moveMonth(-1)
              }
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="이전 달"
            >
              <ChevronLeftIcon />
            </button>

            <p className="text-[14px] font-bold text-slate-900">
              {visibleMonth.getFullYear()}
              년{" "}
              {visibleMonth.getMonth() +
                1}
              월
            </p>

            <button
              type="button"
              onClick={() =>
                moveMonth(1)
              }
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="다음 달"
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7">
              {WEEK_DAY_LABELS.map(
                (label, index) => (
                  <div
                    key={label}
                    className={[
                      "flex h-8 items-center justify-center text-[11px] font-semibold",
                      index === 0
                        ? "text-rose-500"
                        : index === 6
                          ? "text-blue-500"
                          : "text-slate-400",
                    ].join(" ")}
                  >
                    {label}
                  </div>
                ),
              )}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-y-1">
              {calendarDays.map(
                (calendarDay) => {
                  const isSelected =
                    calendarDay.dateKey ===
                    selectedDateKey;

                  const isToday =
                    calendarDay.dateKey ===
                    todayKey;

                  const dateDisabled =
                    isDateDisabled(
                      calendarDay.dateKey,
                    );

                  const dayOfWeek =
                    calendarDay.date.getDay();

                  return (
                    <button
                      key={
                        calendarDay.dateKey
                      }
                      type="button"
                      disabled={
                        dateDisabled
                      }
                      onClick={() =>
                        handleSelectDate(
                          calendarDay.dateKey,
                        )
                      }
                      className={[
                        "relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-medium transition",
                        "disabled:cursor-not-allowed disabled:text-slate-200",
                        isSelected
                          ? "bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700"
                          : "",
                        !isSelected &&
                        !calendarDay.isCurrentMonth
                          ? "text-slate-300"
                          : "",
                        !isSelected &&
                        calendarDay.isCurrentMonth &&
                        dayOfWeek === 0
                          ? "text-rose-500 hover:bg-rose-50"
                          : "",
                        !isSelected &&
                        calendarDay.isCurrentMonth &&
                        dayOfWeek === 6
                          ? "text-blue-500 hover:bg-blue-50"
                          : "",
                        !isSelected &&
                        calendarDay.isCurrentMonth &&
                        dayOfWeek !== 0 &&
                        dayOfWeek !== 6
                          ? "text-slate-700 hover:bg-slate-100"
                          : "",
                        isToday &&
                        !isSelected
                          ? "ring-1 ring-inset ring-blue-400"
                          : "",
                      ].join(" ")}
                    >
                      {
                        calendarDay.day
                      }
                    </button>
                  );
                },
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  const today =
                    toDateKey(
                      new Date(),
                    );

                  if (
                    !isDateDisabled(
                      today,
                    )
                  ) {
                    handleSelectDate(
                      today,
                    );
                  }
                }}
                className="text-[12px] font-semibold text-blue-600 transition hover:text-blue-700"
              >
                오늘
              </button>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="text-[12px] font-medium text-slate-500 transition hover:text-slate-800"
                >
                  선택 해제
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getDatePart(
  dateTimeValue: string,
) {
  return (
    dateTimeValue.split("T")[0] ||
    ""
  );
}

function getTimePart(
  dateTimeValue: string,
) {
  return (
    dateTimeValue.split("T")[1] ||
    "17:00"
  );
}

export default function RequestBasicForm({
  form,
  disabled = false,
  onChange,
}: RequestBasicFormProps) {
  const bidDeadlineDate =
    getDatePart(
      form.bidDeadline,
    );

  const bidDeadlineTime =
    getTimePart(
      form.bidDeadline,
    );

  const handleBidDateChange = (
    dateValue: string,
  ) => {
    if (!dateValue) {
      onChange(
        "bidDeadline",
        "",
      );

      return;
    }

    onChange(
      "bidDeadline",
      `${dateValue}T${bidDeadlineTime}`,
    );
  };

  const handleBidTimeChange = (
    timeValue: string,
  ) => {
    if (!bidDeadlineDate) {
      return;
    }

    onChange(
      "bidDeadline",
      `${bidDeadlineDate}T${timeValue}`,
    );
  };

  return (
    <section className="overflow-visible rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-[16px] font-semibold text-slate-950">
          입찰 기본정보
        </h2>

        <p className="mt-1 text-[13px] leading-5 text-slate-500">
          파트너가 입찰 내용을 검토할 수 있도록
          기본정보를 입력해 주세요.
        </p>
      </div>

      <div className="grid gap-x-5 gap-y-5 p-6 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="block text-[13px] font-semibold text-slate-700">
            프로젝트명
            <span className="ml-1 text-red-500">
              *
            </span>
          </span>

          <input
            type="text"
            value={
              form.projectName
            }
            onChange={(event) =>
              onChange(
                "projectName",
                event.target.value,
              )
            }
            placeholder="예: SPATTER 설비 제작"
            disabled={disabled}
            className="h-11 w-full rounded-md border border-slate-300 px-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <div className="space-y-2">
          <span className="block text-[13px] font-semibold text-slate-700">
            입찰 마감일
            <span className="ml-1 text-red-500">
              *
            </span>
          </span>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_116px]">
            <DatePicker
              id="bid-deadline-date"
              value={
                bidDeadlineDate
              }
              placeholder="마감일 선택"
              disabled={disabled}
              onChange={
                handleBidDateChange
              }
            />

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-500">
                <ClockIcon />
              </span>

              <select
                aria-label="입찰 마감 시간"
                value={
                  bidDeadlineTime
                }
                onChange={(event) =>
                  handleBidTimeChange(
                    event.target.value,
                  )
                }
                disabled={
                  disabled ||
                  !bidDeadlineDate
                }
                className="h-11 w-full appearance-none rounded-md border border-slate-300 bg-white pl-10 pr-8 text-[13px] font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {TIME_OPTIONS.map(
                  (time) => (
                    <option
                      key={time}
                      value={time}
                    >
                      {time}
                    </option>
                  ),
                )}
              </select>

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <ChevronDownIcon />
              </span>
            </div>
          </div>

          <p className="text-[11px] leading-4 text-slate-400">
            파트너사의 입찰 제안서 제출 마감
            날짜와 시간입니다.
          </p>
        </div>

        <div className="space-y-2">
          <span className="block text-[13px] font-semibold text-slate-700">
            희망 납기일
            <span className="ml-1 text-red-500">
              *
            </span>
          </span>

          <DatePicker
            id="due-date"
            value={form.dueDate}
            placeholder="희망 납기일 선택"
            disabled={disabled}
            minDate={
              bidDeadlineDate ||
              undefined
            }
            onChange={(value) =>
              onChange(
                "dueDate",
                value,
              )
            }
          />

          <p className="text-[11px] leading-4 text-slate-400">
            전체 제작 및 품질검사를 완료하고
            납품받기를 희망하는 날짜입니다.
          </p>
        </div>

        <label className="space-y-2">
          <span className="block text-[13px] font-semibold text-slate-700">
            최소 파트너 티어
          </span>

          <select
            value={
              form.minimumPartnerTier
            }
            onChange={(event) =>
              onChange(
                "minimumPartnerTier",
                event.target.value,
              )
            }
            disabled={disabled}
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-[13px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              제한 없음
            </option>

            <option value="tier_1">
              Tier 1
            </option>

            <option value="tier_2">
              Tier 2
            </option>

            <option value="tier_3">
              Tier 3
            </option>
          </select>
        </label>

        <div className="hidden md:block" />

        <label className="space-y-2 md:col-span-2">
          <span className="block text-[13px] font-semibold text-slate-700">
            프로젝트 설명
          </span>

          <textarea
            rows={5}
            value={
              form.description
            }
            onChange={(event) =>
              onChange(
                "description",
                event.target.value,
              )
            }
            placeholder="가공 조건, 품질 요구사항, 납품 조건 등을 입력해 주세요."
            disabled={disabled}
            className="w-full resize-none rounded-md border border-slate-300 px-3.5 py-3 text-[13px] leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="block text-[13px] font-semibold text-slate-700">
            내부 메모
          </span>

          <textarea
            rows={3}
            value={form.memo}
            onChange={(event) =>
              onChange(
                "memo",
                event.target.value,
              )
            }
            placeholder="고객사 내부 메모"
            disabled={disabled}
            className="w-full resize-none rounded-md border border-slate-300 px-3.5 py-3 text-[13px] leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <p className="text-[11px] text-slate-500">
            내부 메모는 파트너에게 공개되지
            않습니다.
          </p>
        </label>
      </div>
    </section>
  );
}