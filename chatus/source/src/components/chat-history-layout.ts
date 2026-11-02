/** A row publishes layout before the same frame paints scroll and shared colour. */
export const HISTORY_LAYOUT = 'chatus:history-layout';
export const HISTORY_PAINT = 'chatus:history-paint';
export type HistoryRowLayout = {row:HTMLElement;progress:number;complete:boolean};
export function notifyHistoryLayout(row:HTMLElement,progress=1,complete=true) {
  row.dispatchEvent(new CustomEvent<HistoryRowLayout>(HISTORY_LAYOUT,{bubbles:true,detail:{row,progress,complete}}));
}
