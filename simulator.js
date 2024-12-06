class ProjectileSimulator {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.baseScale = 2.5;
        this.minScale = 6;
        this.scale = this.baseScale;
        this.ballRadius = 5;
        
        this.projectile = null;
        this.lastTime = 0;
        this.isAnimating = false;
        this.maxHeight = 0;
        this.maxHeightX = 0;
        this.isPaused = false;
        this.currentTime = 0;
        this.sunX = this.canvas.width - 100; // Position of the sun on the right side
        this.sunY = 80; // Position of the sun
        this.sunRadius = 40; // Radius of the sun


        // Add info panel to DOM
        this.createInfoPanel();

        // Create gradient background
        this.createBackground();
    }

    createInfoPanel() {
        const infoPanel = document.createElement('div');
        infoPanel.className = 'info-panel';
        infoPanel.innerHTML = `
            <p>Time: <span id="time">0.00</span> s</p>
            <p>Velocity: <span id="velocity">0.00</span> m/s</p>
            <p>Height: <span id="height">0.00</span> m</p>
            <p>Distance: <span id="distance">0.00</span> m</p>
        `;
        document.body.appendChild(infoPanel);
    }

    createBackground() {
        // Create gradient sky
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');  // Sky blue
        skyGradient.addColorStop(1, '#E0F6FF');  // Light blue
        this.skyGradient = skyGradient;

        // Create sun
        this.sunRadius = 40;
        this.sunX = this.canvas.width - 100;
        this.sunY = 80;
    }

    drawBackground() {
        // Draw day sky
        this.ctx.fillStyle = '#87CEEB'; // Light blue for day
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sun
        this.drawSun();

        // Draw ground with gradient
        const groundGradient = this.ctx.createLinearGradient(0, this.canvas.height - 50, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#90EE90');  // Light green
        groundGradient.addColorStop(1, '#228B22');  // Darker green
        
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
    }

    drawSun() {
        const sunGradient = this.ctx.createRadialGradient(
            this.sunX, this.sunY, 0,
            this.sunX, this.sunY, this.sunRadius
        );
        sunGradient.addColorStop(0, 'rgba(255, 255, 0, 1)'); // Bright yellow
        sunGradient.addColorStop(1, 'rgba(255, 255, 0, 0)'); // Transparent

        this.ctx.beginPath();
        this.ctx.arc(this.sunX, this.sunY, this.sunRadius * 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; // Glow effect
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(this.sunX, this.sunY, this.sunRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = sunGradient;
        this.ctx.fill();
    }

    drawBall(x, y) {
        // Ball gradient
        const ballGradient = this.ctx.createRadialGradient(
            x - this.ballRadius / 3, 
            y - this.ballRadius / 3, 
            0,
            x, 
            y, 
            this.ballRadius
        );
        ballGradient.addColorStop(0, '#ff6b6b');   // Light green for night mode
        ballGradient.addColorStop(0.5, '#ff0000');  // Darker green for night mode
        ballGradient.addColorStop(1, '#8b0000');    // Dark green for night mode

        // Ball shadow
        this.ctx.beginPath();
        this.ctx.arc(x, y + 2, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fill();

        // Main ball
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = ballGradient;
        this.ctx.fill();

        // Highlight
        this.ctx.beginPath();
        this.ctx.arc(
            x - this.ballRadius / 3,
            y - this.ballRadius / 3,
            this.ballRadius / 3,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fill();
    }

    simulate() {
        // Get input values
        const v0 = Number(document.getElementById('velocity').value);
        const angle = Number(document.getElementById('angle').value);

        // Create new projectile
        this.projectile = new Projectile(v0, angle);
        this.projectile.isLaunched = true;
        
        // Calculate max height point
        // Time to max height: vy = v0y - gt = 0, so t = v0y/g
        const timeToMax = this.projectile.v0y / this.projectile.g;
        const maxPos = this.projectile.getPosition(timeToMax);
        this.maxHeight = maxPos.y;
        this.maxHeightX = maxPos.x;
        
        // Reset current time and start animation
        this.currentTime = 0;
        this.isPaused = false; // Ensure it's not paused when launching
        this.isAnimating = true;
        this.lastTime = performance.now();
        this.animate();
    }

    animate(currentTime = performance.now()) {
        if (this.isPaused) {
            requestAnimationFrame(this.animate.bind(this)); // Continue the loop if paused
            return;
        }

        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Update current time and projectile state
        this.currentTime += deltaTime;
        this.projectile.update(deltaTime);
        this.draw();
        this.updateInfoPanel();

        if (this.projectile.isLaunched) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.drawBackground();

        // Draw trajectory path
        this.drawTrajectoryPath();

        const pos = this.projectile.getPosition(this.projectile.currentTime);
        const vel = this.projectile.getVelocity(this.projectile.currentTime);
        const canvasX = pos.x * this.scale;
        const canvasY = this.canvas.height - (pos.y * this.scale);

        // Draw horizontal distance line
        const groundY = this.canvas.height - 50; // Adjusted ground level
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 5]); // Dashed line
        this.ctx.moveTo(0, groundY); // Start from the new ground level
        this.ctx.lineTo(canvasX, groundY); // Draw to the current x position
        this.ctx.strokeStyle = '#FFAA00'; // Color for the distance line
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset to solid line

        // Add horizontal distance label
        this.ctx.fillStyle = '#FFAA00';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(
            `Horizontal Distance: ${pos.x.toFixed(2)} m`,
            canvasX - 10,
            groundY - 10 // Position above the dashed line
        );

        // Draw vectors
        const velocityMagnitude = Math.sqrt(vel.x * vel.x + vel.y * vel.y).toFixed(2);
        this.drawVector(
            canvasX, 
            canvasY, 
            vel.x, 
            vel.y, 
            '#FF4444', 
            2,
            `v = ${velocityMagnitude} m/s`
        );
        
        this.drawVector(
            canvasX, 
            canvasY, 
            0, 
            -this.projectile.g, 
            '#4444FF', 
            1,
            `a = ${this.projectile.g} m/s²`
        );

        // Draw enhanced ball
        this.drawBall(canvasX, canvasY);

        // Draw max height marker
        const maxCanvasX = this.maxHeightX * this.scale;
        const maxCanvasY = this.canvas.height - (this.maxHeight * this.scale);
        
        // Draw marker point
        this.ctx.beginPath();
        this.ctx.arc(maxCanvasX, maxCanvasY, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00AA00';
        this.ctx.fill();

        // Draw dashed line to ground
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 5]);
        this.ctx.moveTo(maxCanvasX, this.canvas.height);
        this.ctx.lineTo(maxCanvasX, maxCanvasY);
        this.ctx.strokeStyle = '#00AA00';
        this.ctx.stroke();

        // Add max height label
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = '#00AA00';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(
            `Max Height = ${this.maxHeight.toFixed(2)}m`,
            maxCanvasX - 5,
            maxCanvasY - 10
        );
    }

    drawTrajectoryPath() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.3)');

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        
        for (let t = 0; t <= this.projectile.timeOfFlight; t += 0.01) {
            const pos = this.projectile.getPosition(t);
            const canvasX = pos.x * this.scale;
            const canvasY = this.canvas.height - (pos.y * this.scale);
            this.ctx.lineTo(canvasX, canvasY);
        }

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawVector(x, y, vx, vy, color = 'orange', scale = 2, label = '') {
        const gradient = this.ctx.createLinearGradient(x, y, x + vx * scale, y - vy * scale);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'white');

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + vx * scale, y - vy * scale);
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 4;
        
        // Add arrowhead
        const angle = Math.atan2(-vy, vx);
        const arrowSize = 10;
        this.ctx.lineTo(
            x + vx * scale - arrowSize * Math.cos(angle - Math.PI / 6),
            y - vy * scale + arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(x + vx * scale, y - vy * scale);
        this.ctx.lineTo(
            x + vx * scale - arrowSize * Math.cos(angle + Math.PI / 6),
            y - vy * scale + arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // Reset shadow

        // Add label with magnitude
        if (label) {
            this.ctx.fillStyle = color;
            this.ctx.font = '14px Arial';
            this.ctx.fillText(
                label,
                x + vx * scale + 5,
                y - vy * scale - 5
            );
        }
        
        this.ctx.lineWidth = 1;
    }

    updateInfoPanel() {
        const pos = this.projectile.getPosition(this.projectile.currentTime);
        const vel = this.projectile.getVelocity(this.projectile.currentTime);

        document.getElementById('time').textContent = 
            this.projectile.currentTime.toFixed(2);
        document.getElementById('velocity').textContent = 
            vel.magnitude.toFixed(2);
        document.getElementById('height').textContent = 
            pos.y.toFixed(2);
        document.getElementById('distance').textContent = 
            pos.x.toFixed(2);
    }

    adjustScale(velocity, angle) {
        // Calculate maximum distance and height
        const angleRad = angle * Math.PI / 180;
        const maxDistance = (velocity * velocity * Math.sin(2 * angleRad)) / this.projectile.g;
        const maxHeight = (velocity * velocity * Math.sin(angleRad) * Math.sin(angleRad)) / (2 * this.projectile.g);

        // Calculate required scales for both dimensions
        const scaleX = (this.canvas.width * 0.88) / maxDistance;
        const scaleY = (this.canvas.height * 0.88) / maxHeight;

        // Use the smaller scale to maintain aspect ratio
        this.scale = Math.min(scaleX, scaleY, this.baseScale);
        
        // Adjust ball radius based on scale but ensure it doesn't get too small
        this.ballRadius = Math.max(3, 5 * (this.scale / this.baseScale));
    }

    togglePause() {
        this.isPaused = !this.isPaused; // Toggle pause state
        const button = document.getElementById('pauseResumeButton');
        button.textContent = this.isPaused ? 'Resume' : 'Pause'; // Update button text
    }
}

const simulator = new ProjectileSimulator();
simulator.simulate();