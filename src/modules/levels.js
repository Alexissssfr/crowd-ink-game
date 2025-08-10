const { Bodies, Body, World, Composites, Constraint } = window.Matter;

// Helper to add a moving platform
function addMovingPlatform(
  world,
  x,
  y,
  w,
  h,
  amplitude = 80,
  speed = 0.02,
  axis = "x"
) {
  const platform = Bodies.rectangle(x, y, w, h, {
    isStatic: true,
    render: { fillStyle: "#3a4a6b" },
  });
  World.add(world, platform);
  let t = 0;
  Matter.Events.on(world.engine || world, "beforeUpdate", () => {
    // In case world is engine.world; we attach to Matter.Events in game instead.
  });
  // The Game will call custom updaters; we return a simple update fn
  platform._update = () => {
    t += speed;
    const offset = Math.sin(t) * amplitude;
    if (axis === "x") {
      Body.setPosition(platform, { x: x + offset, y });
    } else {
      Body.setPosition(platform, { x, y: y + offset });
    }
  };
  return platform;
}

export const levels = [
  {
    name: "Tutoriel: le pont",
    numCharacters: 12,
    requiredSaves: 7,
    spawn: { x: 100, y: 520 },
    goal: { x: 1000, y: 520, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      // Couple d'obstacles: trou central
      const groundLeft = Bodies.rectangle(300, 600, 400, 30, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const groundRight = Bodies.rectangle(900, 600, 400, 30, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      World.add(world, [groundLeft, groundRight]);
    },
  },
  {
    name: "Pentes et glissades",
    numCharacters: 16,
    requiredSaves: 10,
    spawn: { x: 200, y: 200 },
    goal: { x: 980, y: 580, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      // Plates-formes en escaliers
      const plats = [
        Bodies.rectangle(320, 320, 220, 20, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
        Bodies.rectangle(520, 420, 220, 20, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
        Bodies.rectangle(720, 520, 220, 20, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
      ];
      World.add(world, plats);
    },
  },
  {
    name: "Plateforme mobile",
    numCharacters: 18,
    requiredSaves: 12,
    spawn: { x: 120, y: 520 },
    goal: { x: 1040, y: 140, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const base = Bodies.rectangle(200, 600, 300, 30, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const wall = Bodies.rectangle(620, 450, 40, 180, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const high = Bodies.rectangle(1000, 180, 260, 20, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      World.add(world, [base, wall, high]);

      // Moving platform: vertical
      const moving = Bodies.rectangle(760, 420, 160, 18, {
        isStatic: true,
        render: { fillStyle: "#3a4a6b" },
      });
      World.add(world, moving);
      // store updater on body; Game will call it
      let t = 0;
      const speed = 0.03;
      const amp = 120;
      const y0 = 420;
      moving._update = () => {
        t += speed;
        Body.setPosition(moving, { x: 760, y: y0 + Math.sin(t) * amp });
      };
    },
  },
  // --- Challenge pack (parties variées) ---
  {
    name: "Rampe longue + mur",
    numCharacters: 14,
    requiredSaves: 1,
    spawn: { x: 100, y: 560 },
    goal: { x: 1060, y: 160, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const base = Bodies.rectangle(220, 600, 360, 26, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const mid = Bodies.rectangle(620, 470, 360, 22, {
        isStatic: true,
        angle: -0.25,
        render: { fillStyle: "#263246" },
      });
      const wall = Bodies.rectangle(740, 320, 40, 240, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const high = Bodies.rectangle(1020, 200, 280, 18, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      World.add(world, [base, mid, wall, high]);
    },
  },
  {
    name: "Escaliers zigzag",
    numCharacters: 18,
    requiredSaves: 1,
    spawn: { x: 120, y: 500 },
    goal: { x: 980, y: 220, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const steps = [
        Bodies.rectangle(240, 520, 200, 18, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
        Bodies.rectangle(420, 460, 200, 18, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
        Bodies.rectangle(600, 400, 200, 18, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
        Bodies.rectangle(780, 340, 200, 18, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
      ];
      World.add(world, steps);
    },
  },
  {
    name: "Forêt de piliers",
    numCharacters: 22,
    requiredSaves: 1,
    spawn: { x: 100, y: 560 },
    goal: { x: 1040, y: 520, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const ground = Bodies.rectangle(600, 600, 1000, 24, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const pillars = [];
      for (let i = 0; i < 8; i++) {
        pillars.push(
          Bodies.rectangle(300 + i * 90, 520, 20, 180, {
            isStatic: true,
            render: { fillStyle: "#2b354a" },
          })
        );
      }
      World.add(world, [ground, ...pillars]);
    },
  },
  {
    name: "Îlots suspendus",
    numCharacters: 16,
    requiredSaves: 1,
    spawn: { x: 120, y: 300 },
    goal: { x: 1060, y: 180, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const islands = [
        Bodies.rectangle(260, 360, 180, 18, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
        Bodies.rectangle(460, 300, 160, 18, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
        Bodies.rectangle(660, 260, 140, 18, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
        Bodies.rectangle(860, 220, 180, 18, {
          isStatic: true,
          render: { fillStyle: "#263246" },
        }),
      ];
      World.add(world, islands);
    },
  },
  {
    name: "Deux plateformes mobiles",
    numCharacters: 20,
    requiredSaves: 1,
    spawn: { x: 120, y: 520 },
    goal: { x: 1000, y: 520, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const groundLeft = Bodies.rectangle(260, 600, 300, 26, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const groundRight = Bodies.rectangle(940, 600, 300, 26, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const moving1 = Bodies.rectangle(540, 460, 180, 18, {
        isStatic: true,
        render: { fillStyle: "#3a4a6b" },
      });
      const moving2 = Bodies.rectangle(760, 360, 180, 18, {
        isStatic: true,
        render: { fillStyle: "#3a4a6b" },
      });
      let t = 0;
      moving1._update = () => {
        t += 0.03;
        Body.setPosition(moving1, { x: 540 + Math.sin(t) * 160, y: 460 });
      };
      moving2._update = () => {
        t += 0.02;
        Body.setPosition(moving2, { x: 760 - Math.sin(t) * 160, y: 360 });
      };
      World.add(world, [groundLeft, groundRight, moving1, moving2]);
    },
  },
  {
    name: "Canyon",
    numCharacters: 18,
    requiredSaves: 1,
    spawn: { x: 160, y: 560 },
    goal: { x: 980, y: 560, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const left = Bodies.rectangle(220, 600, 260, 26, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const right = Bodies.rectangle(880, 600, 260, 26, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const mid = Bodies.rectangle(550, 540, 120, 18, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      World.add(world, [left, right, mid]);
    },
  },
  {
    name: "Tunnel bas de plafond",
    numCharacters: 14,
    requiredSaves: 1,
    spawn: { x: 120, y: 560 },
    goal: { x: 1000, y: 560, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const floor = Bodies.rectangle(600, 600, 1000, 24, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const roof1 = Bodies.rectangle(400, 520, 260, 16, {
        isStatic: true,
        render: { fillStyle: "#2b354a" },
      });
      const roof2 = Bodies.rectangle(740, 520, 260, 16, {
        isStatic: true,
        render: { fillStyle: "#2b354a" },
      });
      World.add(world, [floor, roof1, roof2]);
    },
  },
  {
    name: "Rampe ⇑ puis saut",
    numCharacters: 16,
    requiredSaves: 1,
    spawn: { x: 120, y: 560 },
    goal: { x: 980, y: 300, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const start = Bodies.rectangle(260, 600, 300, 24, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const ramp = Bodies.rectangle(520, 520, 360, 18, {
        isStatic: true,
        angle: -0.28,
        render: { fillStyle: "#263246" },
      });
      const platform = Bodies.rectangle(820, 340, 200, 18, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      World.add(world, [start, ramp, platform]);
    },
  },
  {
    name: "Chutes en série",
    numCharacters: 24,
    requiredSaves: 1,
    spawn: { x: 140, y: 120 },
    goal: { x: 1020, y: 560, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const top = Bodies.rectangle(200, 160, 280, 18, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const mid1 = Bodies.rectangle(460, 260, 220, 18, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const mid2 = Bodies.rectangle(700, 380, 220, 18, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const low = Bodies.rectangle(940, 520, 280, 22, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      World.add(world, [top, mid1, mid2, low]);
    },
  },
  {
    name: "Pont étroit",
    numCharacters: 12,
    requiredSaves: 1,
    spawn: { x: 160, y: 560 },
    goal: { x: 960, y: 560, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const left = Bodies.rectangle(240, 600, 220, 24, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const right = Bodies.rectangle(920, 600, 220, 24, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const bridge = Bodies.rectangle(580, 560, 180, 12, {
        isStatic: true,
        render: { fillStyle: "#3a4a6b" },
      });
      World.add(world, [left, right, bridge]);
    },
  },
  {
    name: "Plateau central",
    numCharacters: 20,
    requiredSaves: 1,
    spawn: { x: 100, y: 560 },
    goal: { x: 1040, y: 240, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const ground = Bodies.rectangle(300, 600, 380, 26, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const plateau = Bodies.rectangle(620, 360, 300, 22, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const last = Bodies.rectangle(980, 260, 240, 18, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      World.add(world, [ground, plateau, last]);
    },
  },
  {
    name: "Barres verticales",
    numCharacters: 22,
    requiredSaves: 1,
    spawn: { x: 120, y: 560 },
    goal: { x: 1000, y: 560, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const ground = Bodies.rectangle(600, 600, 1000, 24, {
        isStatic: true,
        render: { fillStyle: "#263246" },
      });
      const bars = [];
      for (let i = 0; i < 6; i++)
        bars.push(
          Bodies.rectangle(420 + i * 90, 520, 18, 180, {
            isStatic: true,
            render: { fillStyle: "#2b354a" },
          })
        );
      World.add(world, [ground, ...bars]);
    },
  },
  {
    name: "Échelle horizontale",
    numCharacters: 16,
    requiredSaves: 1,
    spawn: { x: 120, y: 500 },
    goal: { x: 980, y: 500, w: 120, h: 40 },
    walkDirection: 1,
    build(world, W, H) {
      const rungs = [];
      for (let i = 0; i < 6; i++)
        rungs.push(
          Bodies.rectangle(260 + i * 120, 520 - i * 20, 160, 18, {
            isStatic: true,
            render: { fillStyle: "#263246" },
          })
        );
      World.add(world, rungs);
    },
  },
];
