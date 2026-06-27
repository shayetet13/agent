"use client";

import { useState, useRef, useActionState } from "react";
import { registerAgent } from "@/actions/register";
import { emptyFormState, type FormState } from "@/lib/form";
import { ErrorBanner, inputClass } from "./ui";

const THAI_BANKS = [
  { code: "BBL",   name: "กรุงเทพ",               logo: "/svg/bbl.svg"   },
  { code: "KBANK", name: "กสิกรไทย",              logo: "/svg/kbank.svg" },
  { code: "KTB",   name: "กรุงไทย",               logo: "/svg/ktb.svg"   },
  { code: "TTB",   name: "ทหารไทยธนชาต",           logo: "/svg/ttb.svg"   },
  { code: "SCB",   name: "ไทยพาณิชย์",             logo: "/svg/scb.svg"   },
  { code: "BAY",   name: "กรุงศรีอยุธยา",           logo: "/svg/bay.svg"   },
  { code: "KKP",   name: "เกียรตินาคินภัทร",        logo: "/svg/kk.svg"    },
  { code: "CIMB",  name: "ซีไอเอ็มบี ไทย",         logo: "/svg/cimb.svg"  },
  { code: "GSB",   name: "ออมสิน",                 logo: "/svg/gsb.svg"   },
  { code: "BAAC",  name: "ธ.ก.ส.",                 logo: "/svg/baac.svg"  },
  { code: "GHB",   name: "อาคารสงเคราะห์",          logo: "/svg/ghb.svg"   },
  { code: "ISBT",  name: "อิสลามแห่งประเทศไทย",    logo: "/svg/ibank.svg" },
  { code: "LHB",   name: "แลนด์ แอนด์ เฮ้าส์",     logo: "/svg/lhb.svg"   },
  { code: "TISCO", name: "ทิสโก้",                  logo: "/svg/tisco.svg" },
  { code: "UOBT",  name: "ยูโอบี",                  logo: "/svg/uob.svg"   },
  { code: "TCRB",  name: "ไทยเครดิต",                logo: "/svg/tcrb.svg"  },
  { code: "CLICX", name: "CLICX",                     logo: "/svg/clicx.png" },
  { code: "SCBT",  name: "สแตนดาร์ดชาร์เตอร์ด",    logo: "/svg/sc.svg"    },
  { code: "HSBC",  name: "เอชเอสบีซี",              logo: "/svg/hsbc.svg"  },
  { code: "CITI",  name: "ซิตี้แบงก์",              logo: "/svg/citi.svg"  },
] as const;

export function AgentRegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerAgent, emptyFormState);
  const [lineMode, setLineMode] = useState<"id" | "qr">("id");
  const [qrPreview, setQrPreview] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState("");
  const [showBank, setShowBank] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleQrFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setQrPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const selectedBankInfo = THAI_BANKS.find((b) => b.code === selectedBank);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="bankName" value={selectedBank} />
      <ErrorBanner message={state.error} />

      {/* ชื่อ */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700">
          ชื่อ-นามสกุล <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass}
          name="name"
          placeholder="ชื่อ-นามสกุล"
          required
          autoFocus
        />
      </div>

      {/* เบอร์โทร */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700">เบอร์โทรศัพท์</label>
        <input
          className={inputClass}
          name="phone"
          placeholder="08x-xxx-xxxx"
          inputMode="tel"
        />
      </div>

      {/* LINE (required) */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          LINE <span className="text-red-500">*</span>
        </label>

        {/* Toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setLineMode("id")}
            className={`flex-1 py-2 font-medium transition-colors ${
              lineMode === "id"
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-slate-50"
            }`}
          >
            LINE ID
          </button>
          <button
            type="button"
            onClick={() => setLineMode("qr")}
            className={`flex-1 py-2 font-medium transition-colors ${
              lineMode === "qr"
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-slate-50"
            }`}
          >
            QR Code รูปภาพ
          </button>
        </div>

        {lineMode === "id" ? (
          <input
            className={inputClass}
            name="lineId"
            placeholder="@username หรือ LINE ID"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {/* hidden input ชื่อ lineId ว่างถ้าเลือก QR mode */}
            <input type="hidden" name="lineId" value="" />
            <input
              ref={fileRef}
              type="file"
              name="lineQrFile"
              accept="image/*"
              onChange={handleQrFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-colors ${
                qrPreview
                  ? "border-accent bg-indigo-50"
                  : "border-border hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              {qrPreview ? (
                <img src={qrPreview} alt="LINE QR Preview" className="h-32 w-32 object-contain rounded-lg" />
              ) : (
                <>
                  <span className="text-3xl">📷</span>
                  <span className="text-sm text-muted">แตะเพื่ออัปโหลด QR Code LINE</span>
                  <span className="text-xs text-muted/70">JPG, PNG, WEBP</span>
                </>
              )}
            </button>
            {qrPreview && (
              <button
                type="button"
                onClick={() => {
                  setQrPreview("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-xs text-muted hover:text-red-500 transition-colors text-center"
              >
                ✕ เปลี่ยนรูป
              </button>
            )}
          </div>
        )}
      </div>

      {/* อีเมล */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700">อีเมล</label>
        <input
          className={inputClass}
          type="email"
          name="email"
          placeholder="email@example.com"
        />
      </div>

      {/* บัญชีธนาคาร (แสดงเพิ่มเติม) */}
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <button
          type="button"
          onClick={() => setShowBank((v) => !v)}
          className="flex items-center justify-between text-sm font-semibold text-slate-700 w-full"
        >
          <span>ข้อมูลธนาคาร (ไม่บังคับ)</span>
          <span className="text-muted text-xs">{showBank ? "▲ ซ่อน" : "▼ แสดง"}</span>
        </button>

        {showBank && (
          <div className="flex flex-col gap-4">
            {/* Bank picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-600">ธนาคาร</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBank("")}
                  className={`px-2 py-2 rounded-lg border text-xs text-center transition-all ${
                    !selectedBank ? "border-accent bg-indigo-50 text-accent font-semibold" : "border-border text-muted hover:bg-slate-50"
                  }`}
                >
                  ไม่ระบุ
                </button>
                {THAI_BANKS.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => setSelectedBank(b.code)}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-left transition-all ${
                      selectedBank === b.code
                        ? "border-accent bg-indigo-50 ring-1 ring-accent/30"
                        : "border-border hover:bg-slate-50"
                    }`}
                  >
                    <img src={b.logo} alt={b.name} className="w-5 h-5 object-contain shrink-0" />
                    <span className={`text-xs font-medium truncate ${selectedBank === b.code ? "text-accent" : "text-slate-700"}`}>
                      {b.name}
                    </span>
                  </button>
                ))}
              </div>
              {selectedBankInfo && (
                <p className="text-xs text-muted mt-1">เลือก: {selectedBankInfo.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-600">เลขบัญชี</label>
              <input
                className={inputClass}
                name="bankAccount"
                placeholder="xxx-x-xxxxx-x"
                inputMode="numeric"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-600">เบอร์ PromptPay</label>
              <input
                className={inputClass}
                name="promptpay"
                placeholder="0812345678"
                inputMode="numeric"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-80"
        style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
      >
        ลงทะเบียน
      </button>
    </form>
  );
}
