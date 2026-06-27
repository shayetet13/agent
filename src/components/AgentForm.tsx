"use client";

import { useState } from "react";
import { useActionState } from "react";
import { saveAgent } from "@/actions/agents";
import { emptyFormState, type FormState } from "@/lib/form";
import type { Agent } from "@/lib/types";
import Link from "next/link";
import { SubmitButton, Field, ErrorBanner, inputClass } from "./ui";
import { PromptPayQR } from "./PromptPayQR";

// ──── ธนาคารไทยทั้งหมด ────────────────────────────────────────────────────
const THAI_BANKS = [
  { code: "BBL",  name: "กรุงเทพ",               abbr: "BBL",   logo: "/svg/bbl.svg"   },
  { code: "KBANK",name: "กสิกรไทย",              abbr: "KBANK", logo: "/svg/kbank.svg" },
  { code: "KTB",  name: "กรุงไทย",               abbr: "KTB",   logo: "/svg/ktb.svg"   },
  { code: "TTB",  name: "ทหารไทยธนชาต",           abbr: "TTB",   logo: "/svg/ttb.svg"   },
  { code: "SCB",  name: "ไทยพาณิชย์",             abbr: "SCB",   logo: "/svg/scb.svg"   },
  { code: "BAY",  name: "กรุงศรีอยุธยา",           abbr: "BAY",   logo: "/svg/bay.svg"   },
  { code: "KKP",  name: "เกียรตินาคินภัทร",        abbr: "KKP",   logo: "/svg/kk.svg"    },
  { code: "CIMB", name: "ซีไอเอ็มบี ไทย",         abbr: "CIMB",  logo: "/svg/cimb.svg"  },
  { code: "GSB",  name: "ออมสิน",                 abbr: "GSB",   logo: "/svg/gsb.svg"   },
  { code: "BAAC", name: "ธ.ก.ส.",                 abbr: "BAAC",  logo: "/svg/baac.svg"  },
  { code: "GHB",  name: "อาคารสงเคราะห์",          abbr: "GHB",   logo: "/svg/ghb.svg"   },
  { code: "ISBT", name: "อิสลามแห่งประเทศไทย",    abbr: "iBank", logo: "/svg/ibank.svg" },
  { code: "LHB",  name: "แลนด์ แอนด์ เฮ้าส์",     abbr: "LHB",   logo: "/svg/lhb.svg"   },
  { code: "TISCO",name: "ทิสโก้",                  abbr: "TISCO", logo: "/svg/tisco.svg" },
  { code: "UOBT", name: "ยูโอบี",                  abbr: "UOB",   logo: "/svg/uob.svg"   },
  { code: "TCRB",  name: "ไทยเครดิต",                abbr: "TCRB",  logo: "/svg/tcrb.svg"  },
  { code: "CLICX", name: "CLICX",                     abbr: "CLICX", logo: "/svg/clicx.png" },
  { code: "SCBT", name: "สแตนดาร์ดชาร์เตอร์ด",    abbr: "SC",    logo: "/svg/sc.svg"    },
  { code: "HSBC", name: "เอชเอสบีซี",              abbr: "HSBC",  logo: "/svg/hsbc.svg"  },
  { code: "CITI", name: "ซิตี้แบงก์",              abbr: "CITI",  logo: "/svg/citi.svg"  },
] as const;


function BankOption({ bank, selected, onClick }: {
  bank: typeof THAI_BANKS[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
        selected
          ? "border-accent bg-indigo-50 ring-2 ring-accent/30"
          : "border-border bg-surface hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <img src={bank.logo} alt={bank.name} className="w-6 h-6 object-contain shrink-0" />
      <span className="text-sm leading-tight">
        <span className={`font-medium ${selected ? "text-accent" : "text-foreground"}`}>{bank.name}</span>
        <span className="text-xs text-muted block">{bank.abbr}</span>
      </span>
      {selected && (
        <svg className="w-4 h-4 text-accent ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

export function AgentForm({ agent }: { agent?: Agent }) {
  const [state, action] = useActionState<FormState, FormData>(saveAgent, emptyFormState);
  const [promptpay, setPromptpay] = useState(agent?.promptpay ?? "");
  const [selectedBank, setSelectedBank] = useState<string>(agent?.bankName ?? "");
  const [showBankPicker, setShowBankPicker] = useState(false);

  const selectedBankInfo = THAI_BANKS.find((b) => b.code === selectedBank);

  return (
    <form action={action} className="flex flex-col gap-4">
      {agent && <input type="hidden" name="id" value={agent.id} />}
      <input type="hidden" name="bankName" value={selectedBank} />
      <ErrorBanner message={state.error} />

      <Field label="ชื่อนายหน้า" required>
        <input
          className={inputClass}
          name="name"
          defaultValue={agent?.name}
          placeholder="ชื่อ-นามสกุล"
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="เบอร์โทร">
          <input className={inputClass} name="phone" defaultValue={agent?.phone} placeholder="08x-xxx-xxxx" />
        </Field>
        <Field label="อีเมล">
          <input className={inputClass} type="email" name="email" defaultValue={agent?.email} placeholder="email@example.com" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="LINE ID">
          <input
            className={inputClass}
            name="lineId"
            defaultValue={agent?.lineId}
            placeholder="@username หรือ ID LINE"
          />
        </Field>
        <Field label="เบอร์ PromptPay">
          <input
            className={inputClass}
            name="promptpay"
            value={promptpay}
            onChange={(e) => setPromptpay(e.target.value)}
            placeholder="0812345678 หรือเลขบัตรประชาชน"
            inputMode="numeric"
          />
        </Field>
      </div>

      {/* QR Preview */}
      {promptpay.replace(/\D/g, "").length >= 10 && (
        <div className="flex flex-col items-center gap-2 py-2">
          <PromptPayQR value={promptpay} size={140} />
          <p className="text-xs text-muted">ตัวอย่าง QR PromptPay</p>
        </div>
      )}

      {/* Bank section */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">ธนาคาร</label>

        {/* Selected bank display / toggle */}
        <button
          type="button"
          onClick={() => setShowBankPicker((v) => !v)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
            selectedBankInfo
              ? "border-accent bg-indigo-50"
              : "border-border bg-surface hover:bg-slate-50"
          }`}
        >
          {selectedBankInfo ? (
            <>
              <img src={selectedBankInfo.logo} alt={selectedBankInfo.name} className="w-8 h-8 object-contain shrink-0" />
              <div>
                <p className="text-sm font-semibold text-accent">{selectedBankInfo.name}</p>
                <p className="text-xs text-muted">{selectedBankInfo.abbr}</p>
              </div>
              <span className="ml-auto text-xs text-muted">{showBankPicker ? "▲ ซ่อน" : "▼ เปลี่ยน"}</span>
            </>
          ) : (
            <>
              <span className="w-8 h-8 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-muted text-lg">🏦</span>
              <span className="text-sm text-muted">— เลือกธนาคาร —</span>
              <span className="ml-auto text-xs text-muted">{showBankPicker ? "▲" : "▼"}</span>
            </>
          )}
        </button>

        {/* Bank picker grid */}
        {showBankPicker && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-border">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => { setSelectedBank(""); setShowBankPicker(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                !selectedBank ? "border-accent bg-indigo-50 ring-2 ring-accent/30" : "border-border bg-white hover:bg-slate-50"
              }`}
            >
              <span className="w-6 h-6 rounded-md bg-slate-200 shrink-0 flex items-center justify-center text-muted text-sm">—</span>
              <span className="text-sm text-muted">ไม่ระบุ</span>
            </button>
            {THAI_BANKS.map((bank) => (
              <BankOption
                key={bank.code}
                bank={bank}
                selected={selectedBank === bank.code}
                onClick={() => { setSelectedBank(bank.code); setShowBankPicker(false); }}
              />
            ))}
          </div>
        )}
      </div>

      <Field label="เลขบัญชีธนาคาร">
        <input className={inputClass} name="bankAccount" defaultValue={agent?.bankAccount} placeholder="xxx-x-xxxxx-x" />
      </Field>

      <Field label="หมายเหตุ">
        <textarea className={inputClass} name="note" defaultValue={agent?.note} rows={3} placeholder="บันทึกเพิ่มเติม" />
      </Field>

      <div className="flex gap-3 pt-2">
        <SubmitButton label={agent ? "บันทึกการแก้ไข" : "เพิ่มนายหน้า"} />
        <Link href="/agents" className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-slate-100 transition-colors">
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
