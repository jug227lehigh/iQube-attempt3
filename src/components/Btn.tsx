interface BtnI {
  btnText: string
  btnClr: string
}

export default function Btn({ btnText, btnClr }: BtnI) {
  return <button className={`${btnClr} mt-[50px]`}>{btnText}</button>
}
