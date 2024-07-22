const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const cooldownDisplay = document.getElementById('cooldown');
const gameOverDisplay = document.getElementById('gameOver');

// 게임 상태 변수
let player = { x: canvas.width / 2, y: canvas.height - 50, width: 50, height: 50, color: 'blue' };
let bullets = [];
let lasers = [];
let enemies = [];
let keys = {};
let score = 0;
let gameOver = false;
let lastFireTime = 0; // 총알 발사 시간 기록
let lastLaserTime = 0; // 레이저 발사 시간 기록
let laserCooldown = 3000; // 레이저 쿨타임 (3초)
let laserCooldownRemaining = 0; // 남은 쿨타임 시간

// 키 이벤트 리스너 추가
document.addEventListener('keydown', (event) => {
  keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

// 게임 재시작
canvas.addEventListener('click', () => {
  if (gameOver) {
    gameOver = false;
    score = 0;
    player = { x: canvas.width / 2, y: canvas.height - 50, width: 50, height: 50, color: 'blue' };
    bullets = [];
    lasers = [];
    enemies = [];
    scoreDisplay.textContent = `Score: ${score}`;
    cooldownDisplay.textContent = `Laser Cooldown: 0s`;
    gameOverDisplay.style.display = 'none';
    gameLoop();
  }
});

// 게임 루프
function gameLoop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
}

// 게임 업데이트
function update() {
  const currentTime = Date.now();

  // 플레이어 이동
  if (keys['ArrowLeft'] && player.x > 0) {
    player.x -= 5;
  }
  if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
    player.x += 5;
  }

  // 총알 발사
  if (keys[' '] && currentTime - lastFireTime > 300) { // 발사 속도 조정 (300ms 간격)
    bullets.push({ x: player.x + player.width / 2 - 20, y: player.y, text: '최영숙', fontSize: 20, color: 'red' });
    lastFireTime = currentTime;
  }

  // 레이저 발사
  if (keys['Control'] && currentTime - lastLaserTime > laserCooldown) {
    for (let i = 0; i < 5; i++) {
      lasers.push({ x: player.x + player.width / 2 - 150, y: 0, width: 300, height: canvas.height, color: 'cyan' });
    }
    lastLaserTime = currentTime;
    laserCooldownRemaining = laserCooldown; // 쿨타임 시작
  }

  // 레이저 쿨타임 업데이트
  if (laserCooldownRemaining > 0) {
    laserCooldownRemaining -= 100; // 100ms마다 쿨타임 감소
    cooldownDisplay.textContent = `Laser Cooldown: ${(laserCooldownRemaining / 1000).toFixed(1)}s`;
  } else {
    cooldownDisplay.textContent = `Laser Cooldown: 0s`;
  }

  // 총알 이동
  bullets = bullets.map(bullet => ({ ...bullet, y: bullet.y - 5 })).filter(bullet => bullet.y > 0);

  // 레이저 이동
  lasers = lasers.map(laser => ({ ...laser, y: laser.y + 10 })).filter(laser => laser.y < canvas.height);

  // 적 생성
  if (Math.random() < 0.02) {
    enemies.push({ type: 'green', x: Math.random() * (canvas.width - 60), y: 0, width: 60, height: 60, color: 'green', hits: 0 });
  }
  if (Math.random() < 0.01) {
    enemies.push({ type: 'purple', x: Math.random() * (canvas.width - 40), y: 0, width: 40, height: 40, color: 'black', hits: 0 }); // 보라색 적을 검정색으로 변경
  }
  if (Math.random() < 0.005) {
    enemies.push({ type: 'gray', x: Math.random() * (canvas.width - 50), y: 0, width: 60, height: 60, color: 'gray', hits: 0 });
  }

  // 적 이동
  enemies = enemies.map(enemy => {
    if (enemy.type === 'green') {
      return { ...enemy, y: enemy.y + 2 };
    } else if (enemy.type === 'purple') {
      return { ...enemy, y: enemy.y + 4 };
    } else if (enemy.type === 'gray') {
      return { ...enemy, y: enemy.y + 0.5 }; // 회색 적의 속도를 느리게 함
    }
  }).filter(enemy => enemy.y < canvas.height);

  // 적이 바닥에 닿으면 점수 감소
  enemies.forEach((enemy, eIndex) => {
    if (enemy.y + enemy.height > canvas.height) {
      enemies.splice(eIndex, 1);
      score -= 10;
      scoreDisplay.textContent = `Score: ${score}`;
    }
  });

  // 충돌 검사 (적과 플레이어)
  enemies.forEach(enemy => {
    if (enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x &&
      enemy.y < player.y + player.height &&
      enemy.y + enemy.height > player.y) {
      gameOver = true;
      gameOverDisplay.style.display = 'block';
    }
  });

  // 충돌 검사 (총알(글자)과 적)
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      // 총알의 텍스트가 적의 영역과 충돌하는지 검사
      if (bullet.x < enemy.x + enemy.width &&
        bullet.x + 100 > enemy.x && // 글자 폭을 100으로 가정
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.fontSize > enemy.y) {

        if (enemy.type === 'gray') {
          enemy.hits += 1;
          if (enemy.hits >= 3) {
            enemies.splice(eIndex, 1);
            score += 30;
          }
        } else {
          bullets.splice(bIndex, 1);
          enemies.splice(eIndex, 1);
          score += enemy.type === 'green' ? 10 : 20;
        }

        scoreDisplay.textContent = `Score: ${score}`;
      }
    });
  });

  // 충돌 검사 (레이저와 적)
  lasers.forEach((laser, lIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (laser.x < enemy.x + enemy.width &&
        laser.x + laser.width > enemy.x &&
        laser.y < enemy.y + enemy.height &&
        laser.y + laser.height > enemy.y) {

        if (enemy.type === 'gray') {
          enemy.hits += 1;
          if (enemy.hits >= 3) {
            enemies.splice(eIndex, 1);
            score += 30;
          }
        } else {
          enemies.splice(eIndex, 1);
          score += enemy.type === 'green' ? 10 : 20;
        }

        lasers.splice(lIndex, 1);
        scoreDisplay.textContent = `Score: ${score}`;
      }
    });
  });
}

// 게임 그리기
function draw() {
  // 배경 그리기 (보라색)
  ctx.fillStyle = 'purple';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 플레이어 그리기
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // 총알 그리기
  bullets.forEach(bullet => {
    ctx.fillStyle = bullet.color;
    ctx.font = `${bullet.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(bullet.text, bullet.x + 20, bullet.y + 20); // 총알 중앙에 텍스트 표시
  });

  // 레이저 그리기
  lasers.forEach(laser => {
    ctx.fillStyle = laser.color;
    ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
  });

  // 적 그리기
  enemies.forEach(enemy => {
    ctx.fillStyle = enemy.color;
    if (enemy.type === 'green') {
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    } else if (enemy.type === 'purple') {
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.type === 'gray') {
      drawHexagon(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2);
    }
    // 적 체력 표시
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText(`HP: ${3 - enemy.hits}`, enemy.x + enemy.width / 2 - 15, enemy.y + enemy.height / 2 + 5);
  });

  // 화면 중앙에 텍스트
  ctx.fillStyle = 'white'; // 텍스트 색상을 흰색으로 변경
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('보라색 집', canvas.width / 2, canvas.height / 2);
}

// 육각형 그리기 함수
function drawHexagon(x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(x + radius * Math.cos((Math.PI / 3) * i), y + radius * Math.sin((Math.PI / 3) * i));
  }
  ctx.closePath();
  ctx.fill();
}

// 게임 루프 시작
gameLoop();
