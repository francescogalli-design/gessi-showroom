export class LoadingScreen {
  private element: HTMLElement;
  private barFill: HTMLElement;
  private text: HTMLElement;

  constructor() {
    this.element = document.getElementById('loading-screen')!;
    this.barFill = this.element.querySelector('.loading-bar-fill')!;
    this.text = this.element.querySelector('.loading-text')!;
  }

  setProgress(progress: number, label?: string) {
    this.barFill.style.width = `${Math.min(100, progress)}%`;
    if (label) {
      this.text.textContent = label;
    }
  }

  hide() {
    this.setProgress(100, 'Ready');
    setTimeout(() => {
      this.element.classList.add('hidden');
    }, 400);
  }
}
