import type { ConversationSummary as Conv } from "@/lib/types";

export default function Avatar({ conv }: { conv: Conv }) {
  if (conv.pictureUrl)
    return <img className="ib-av" src={conv.pictureUrl} alt="" />;
  return (
    <div className="ib-av" aria-hidden>
      {conv.displayName.charAt(0).toUpperCase()}
    </div>
  );
}
