import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnInit {
  @Input() tooltipText = '';
  @Input() showOnlyIf = true;

  private tooltipElement: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'custom-tooltip');
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(
      this.tooltipElement,
      'background-color',
      'rgba(39, 52, 196, 0.9)'
    );
    this.renderer.setStyle(this.tooltipElement, 'color', '#fff');
    this.renderer.setStyle(this.tooltipElement, 'padding', '8px 12px');
    this.renderer.setStyle(this.tooltipElement, 'border-radius', '4px');
    this.renderer.setStyle(this.tooltipElement, 'font-size', '14px');
    this.renderer.setStyle(this.tooltipElement, 'z-index', '1000');
    this.renderer.setStyle(this.tooltipElement, 'pointer-events', 'none');
    this.renderer.setStyle(this.tooltipElement, 'opacity', '0');
    this.renderer.setStyle(this.tooltipElement, 'transition', 'opacity 0.3s');
    this.renderer.setStyle(this.tooltipElement, 'white-space', 'nowrap');
    this.renderer.setStyle(
      this.tooltipElement,
      'box-shadow',
      '0 2px 10px rgba(0,0,0,0.2)'
    );

    const arrow = this.renderer.createElement('div');
    this.renderer.setStyle(arrow, 'position', 'absolute');
    this.renderer.setStyle(arrow, 'width', '0');
    this.renderer.setStyle(arrow, 'height', '0');
    this.renderer.setStyle(arrow, 'border-left', '6px solid transparent');
    this.renderer.setStyle(arrow, 'border-right', '6px solid transparent');
    this.renderer.setStyle(
      arrow,
      'border-top',
      '6px solid rgba(39, 52, 196, 0.9)'
    );
    this.renderer.setStyle(arrow, 'bottom', '-6px');
    this.renderer.setStyle(arrow, 'left', '50%');
    this.renderer.setStyle(arrow, 'transform', 'translateX(-50%)');

    this.renderer.appendChild(this.tooltipElement, arrow);

    const textNode = this.renderer.createText(this.tooltipText);
    this.renderer.appendChild(this.tooltipElement, textNode);

    this.renderer.appendChild(document.body, this.tooltipElement);
  }

  @HostListener('mouseenter')
  @HostListener('touchstart')
  onMouseEnter(): void {
    if (!this.showOnlyIf) return;

    const rect = this.el.nativeElement.getBoundingClientRect();

    this.renderer.setStyle(
      this.tooltipElement,
      'top',
      `${rect.top + window.scrollY - 10}px`
    );
    this.renderer.setStyle(
      this.tooltipElement,
      'left',
      `${rect.left + window.scrollX + rect.width / 2}px`
    );
    this.renderer.setStyle(
      this.tooltipElement,
      'transform',
      'translate(-50%, -100%)'
    );
    this.renderer.setStyle(this.tooltipElement, 'opacity', '1');
  }

  @HostListener('mouseleave')
  @HostListener('touchend')
  onMouseLeave(): void {
    if (this.tooltipElement) {
      this.renderer.setStyle(this.tooltipElement, 'opacity', '0');
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (
      this.tooltipElement &&
      this.showOnlyIf &&
      window.getComputedStyle(this.tooltipElement).opacity !== '0'
    ) {
      this.onMouseEnter();
    }
  }

  ngOnDestroy(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
    }
  }
}
