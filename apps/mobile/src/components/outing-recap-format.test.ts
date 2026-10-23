import {it,expect} from 'vitest';
import {formatFieldLabRecap} from './outing-recap-format';

it('shows a positive sub-percent restoration without rounding it down to zero',()=>{
 expect(formatFieldLabRecap(0.004,0.01).restoration).toBe('<1% restoration');
});

it('keeps the rounded whole-percent restoration for larger positive fractions',()=>{
 expect(formatFieldLabRecap(0.124,0.2).restoration).toBe('12% restoration');
});

it('says no resistance was restored when the confirmed reduction is zero',()=>{
 const result=formatFieldLabRecap(0,0);
 expect(result.restoration).toBe('0% restoration');
 expect(result.explanation).toBe('No resistance was restored in this collection.');
 expect(result.explanation).not.toContain('Reduced resistance');
});
