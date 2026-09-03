import { APP_NAME } from '../lib/constants'

export default function AuthSplash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#1d3434] text-[#f6f7ef]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#c9e75b] text-[22px] font-bold text-[#1d3434]">+</span>
        <span className="font-['Space_Grotesk'] text-[22px] font-bold tracking-[-0.6px]">{APP_NAME.toLowerCase()}</span>
      </div>
    </div>
  )
}
