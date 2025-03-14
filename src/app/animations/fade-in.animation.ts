import { trigger, transition, style, animate } from '@angular/animations';

export const fadeAnimation = trigger('fadeAnimation', [
  transition('* => *', [
    style({ opacity: 0 }),
    animate('450ms', style({ opacity: 1 })),
  ]),
]);
