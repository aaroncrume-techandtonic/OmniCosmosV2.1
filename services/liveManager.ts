export class LiveSessionManager {
  private ticker: number | null = null;
  private statusStep = 0;
  private readonly statusScript = [
    "Connecting to the Cosmos...",
    "Aligning local star charts...",
    "Oracle resonance stabilized.",
    "Connected. Speak to the Oracle.",
  ];

  constructor(
    private onStatusChange: (status: string) => void,
    private onError: (error: string) => void
  ) {}

  async connect() {
    try {
      this.statusStep = 0;
      this.onStatusChange(this.statusScript[this.statusStep]);

      this.ticker = window.setInterval(() => {
        this.statusStep = Math.min(this.statusStep + 1, this.statusScript.length - 1);
        this.onStatusChange(this.statusScript[this.statusStep]);
      }, 1300);
    } catch (err) {
      console.error(err);
      this.onError("Failed to initialize local live mode.");
    }
  }

  async disconnect() {
    if (this.ticker !== null) {
      window.clearInterval(this.ticker);
      this.ticker = null;
    }
    
    this.onStatusChange("Disconnected");
  }
}
