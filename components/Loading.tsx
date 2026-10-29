export default function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="ib-loading" role="status" aria-label={label}>
      <span className="ib-spinner" aria-hidden />
    </div>
  );
}
