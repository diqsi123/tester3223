import {createRoot} from 'react-dom/client';
import {ChatEndActions,ChatRatingCard} from '../src/components/ChatActions';
import '../src/styles.css';
import '../src/prototype.css';
import './optical-review.css';
const noAction=()=>{};
createRoot(document.getElementById('root')!).render(<main>
<h2>Figma · исходный контур · 4×</h2>
<div className="inspection-window"><div className="reference-canvas">
<img className="ref-gold" src="/assets/dialog/gold-action-surface.svg"/>
<img className="ref-label" src="/tests/optical-reference/next-label.svg"/>
<img className="ref-icon" src="/tests/optical-reference/next-icon.svg"/>
</div></div>
<h2>Реальный компонент · 4×</h2>
<div className="inspection-window"><div className="actual-canvas dialog-root"><ChatEndActions onHome={noAction} onNext={noAction}/></div></div>
<h2>Реальная оценка · 2.5×</h2>
<div className="rating-window"><div className="rating-canvas dialog-root"><ChatRatingCard value="like" onChange={noAction}/></div></div>
</main>);
