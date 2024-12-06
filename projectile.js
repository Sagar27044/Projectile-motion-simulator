class Projectile {
    constructor(v0, angle) {
        this.v0 = v0;
        this.angle = angle * Math.PI / 180;
        this.g = 9.81;
        
        this.v0x = this.v0 * Math.cos(this.angle);
        this.v0y = this.v0 * Math.sin(this.angle);
        this.timeOfFlight = (2 * this.v0y) / this.g;
        
        // Current state
        this.currentTime = 0;
        this.isLaunched = false;
    }

    getPosition(t) {
        const x = this.v0x * t;
        const y = this.v0y * t - (0.5 * this.g * t * t);
        return { x, y };
    }

    getVelocity(t) {
        const vx = this.v0x;
        const vy = this.v0y - this.g * t;
        return { 
            x: vx, 
            y: vy,
            magnitude: Math.sqrt(vx * vx + vy * vy)
        };
    }

    update(deltaTime) {
        if (!this.isLaunched) return;
        
        this.currentTime += deltaTime;
        if (this.currentTime >= this.timeOfFlight) {
            this.currentTime = this.timeOfFlight;
            this.isLaunched = false;
        }
    }
}