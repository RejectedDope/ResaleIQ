type ProfitBreakdownProps = {
  grossSale: number
  totalFees: number
  netProfit: number
  roi: number
}

export default function ProfitBreakdown(props: ProfitBreakdownProps) {
  return (
    <div className="rounded-2xl border border-[#E2DDD5] bg-white p-5">
      <h3 className="text-lg font-semibold">Profit Breakdown</h3>
      <div className="mt-3 space-y-2 text-sm">
        <p>Gross Sale: ${props.grossSale.toFixed(2)}</p>
        <p>Total Fees: ${props.totalFees.toFixed(2)}</p>
        <p>Net Profit: ${props.netProfit.toFixed(2)}</p>
        <p>ROI: {props.roi.toFixed(1)}%</p>
      </div>
    </div>
  )
}
