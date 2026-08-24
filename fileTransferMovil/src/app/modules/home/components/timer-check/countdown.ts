export class CountdownTimer {
    private endTime: number;
    private intervalId: number | undefined;

    public constructor(minutes: number, private displayElement: HTMLElement) {
        this.endTime = Date.now() + minutes * 60 * 1000;
        this.start();
    }

    private start() {
        this.intervalId = window.setInterval(() => this.update(), 1000);
    }

    private update() {
        const remainingTime = this.endTime - Date.now();
        if (remainingTime <= 0) {
            this.displayElement.textContent = '¡Tiempo cumplido!';
            this.stop();
        } else {
            this.displayElement.textContent = this.formatTime(remainingTime);
        }
    }

    private stop() {
        if (this.intervalId !== undefined) {
            clearInterval(this.intervalId);
        }
    }

    private formatTime(milliseconds: number): string {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    private pad(num: number): string {
        return num < 10 ? `0${num}` : num.toString();
    }
}
