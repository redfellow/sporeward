import {it,expect} from 'vitest';
import {formatFieldLabRecap} from './outing-recap-format';

it('shows a positive sub-percent restoration without rounding it down to zero',()=>{
 expect(formatFieldLabRecap(0.004,0.01).restoration).toBe('<1% restoration');
});

it('explains the possible later familiar-area benefit without predicting exact points',()=>{
 const {explanation}=formatFieldLabRecap(0.25,0.1);
 expect(explanation).toContain('may lessen resistance-based point loss');
 expect(explanation).toContain('later eligible ordinary visits near familiar areas');
 expect(explanation).toContain('No exact future point amount is promised');
 expect(explanation).toContain('subsequent contributions, elapsed time and reward rounding');
 expect(explanation).not.toMatch(/\b\d+\s+points\b/);
});

it('keeps the rounded whole-percent restoration for larger positive fractions',()=>{
 expect(formatFieldLabRecap(0.124,0.2).restoration).toBe('12% restoration');
});

it('says no resistance was restored when the confirmed reduction is zero',()=>{
 const result=formatFieldLabRecap(0,0);
 expect(result.restoration).toBe('0% restoration');
 expect(result.explanation).toBe('No resistance was restored in this collection.');
 expect(result.explanation).not.toContain('later');
 expect(result.explanation).not.toContain('visit points');
});
