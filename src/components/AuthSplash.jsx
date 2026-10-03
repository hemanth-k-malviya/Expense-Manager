import { APP_NAME } from '../lib/constants'

export default function AuthSplash({ message }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#1d3434] px-6 text-[#f6f7ef]">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#c9e75b] text-[22px] font-bold text-[#1d3434]">+</span>
          <span className="font-['Space_Grotesk'] text-[22px] font-bold tracking-[-0.6px]">{APP_NAME.toLowerCase()}</span>
        </div>
        <span
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#3b5250] border-t-[#c9e75b]"
          aria-hidden="true"
        />
        {message ? <p className="max-w-xs text-[13px] leading-5 text-[#adc0b9]">{message}</p> : null}
      </div>
    </div>
  )
}
