"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  MouseEvent as ReactMouseEvent,
} from "react";
import { Box, Flex, Portal, Fade, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import * as THREE from "three";
import { useTranslations } from "next-intl";

// ========== ここから追加: グローバルカウンタによるユニークID生成 ==========
let globalCounter = 0;
function generateUniqueId() {
  // 関数が呼ばれるたびにカウンタをインクリメントして返す
  globalCounter++;
  return globalCounter;
}
// ======================================================

// 定数（各種アニメーション期間など）
const BG_ANIM_DURATION = "60s";
const HUE_SHIFT_DURATION = "80s";
const SWIRL1_DURATION = "80s";
const SWIRL2_DURATION = "100s";
const FAIRY_DUST_DURATION = "10s";
const NEON_GLOW_DURATION = "3s";
const BLINK_DURATION = "1.2s";
const RIPPLE_DURATION = "1s";

// Three.js を利用した背景コンポーネント
const ThreeCosmicBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // シーン・カメラ・レンダラーの作成
    const scene = new THREE.Scene();
    // うっすらと青みがかった霧
    scene.fog = new THREE.Fog(0xe3f2fd, 50, 800);

    let width = window.innerWidth;
    let height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // ライトの追加（青系の優しい照明）
    const pointLight = new THREE.PointLight(0xcceeff, 1, 500);
    pointLight.position.set(0, 0, 50);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xe0f7fa, 0.5);
    scene.add(ambientLight);

    // 星のパーティクル（淡い水色）
    const starCount = 1000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 500;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 500;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 500;
    }
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xbbdefb, // 淡い青
      size: 2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // 中心の球体（青系）
    const sphereGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x90caf9, // やわらかい水色
      emissive: 0xd6eaf9,
      shininess: 80,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // マウスインタラクション
    let mouseX = 0,
      mouseY = 0;
    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // クリックで強調
    const onClick = () => {
      pointLight.intensity = 2;
      sphere.material.emissive.setHex(0xe3f2fd);
      setTimeout(() => {
        pointLight.intensity = 1;
        sphere.material.emissive.setHex(0xd6eaf9);
      }, 100);
    };
    window.addEventListener("click", onClick);

    // ウィンドウリサイズ対応
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // アニメーションループ
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      stars.rotation.y += 0.0005;
      stars.rotation.x += 0.0002;
      sphere.rotation.y += 0.005;
      sphere.rotation.x += 0.003;

      const t = performance.now() * 0.001;
      pointLight.position.x = Math.sin(t) * 50;
      pointLight.position.z = Math.cos(t) * 50;

      camera.position.x += (mouseX * 20 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 10 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("resize", handleResize);
      scene.remove(stars, sphere, pointLight, ambientLight);
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <Box
      ref={mountRef}
      position="absolute"
      top="0"
      left="0"
      width="100%"
      height="100%"
      overflow="hidden"
      zIndex={1}
    />
  );
};

// Three.js を利用した中央オーブ（3D）コンポーネント
const ThreeCentralOrb: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const width = 300;
    const height = 300;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // 中央オーブ
    const orbGeometry = new THREE.SphereGeometry(15, 32, 32);
    const orbMaterial = new THREE.MeshPhongMaterial({
      color: 0xe0f7fa, // やわらかい水色寄り
      emissive: 0xe0f0f7,
      shininess: 50,
      specular: 0xb2ebf2,
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orb);

    // リング
    const ringGeometry = new THREE.TorusGeometry(
      22,
      1.5,
      64,
      400,
      Math.PI * 2
    );
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x81d4fa,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);

    // 照明
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      orb.rotation.x += 0.01;
      orb.rotation.y += 0.01;
      ring.rotation.x -= 0.005;
      ring.rotation.y -= 0.005;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      orbGeometry.dispose();
      orbMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
    };
  }, []);

  return <Box ref={mountRef} width="300px" height="300px" />;
};

// CSS キーフレームアニメーション定義
const pastelBgMovement = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pastelHueShift = keyframes`
  0% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(20deg); }
  100% { filter: hue-rotate(0deg); }
`;

const pastelSwirl1 = keyframes`
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
`;

const pastelSwirl2 = keyframes`
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(-360deg); }
`;

const fairyDust = keyframes`
  0% { transform: translate(0, 0); opacity: 0; }
  10% { opacity: 1; }
  50% { transform: translate(150vw, 150vh); opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translate(160vw, 160vh); opacity: 0; }
`;

const sparkleFlash = keyframes`
  0% { opacity: 0; transform: scale(0.2) rotate(0deg); }
  50% { opacity: 0.8; transform: scale(1.2) rotate(180deg); }
  100% { opacity: 0; transform: scale(0.2) rotate(360deg); }
`;

const softNeonGlow = keyframes`
  0%, 100% {
    text-shadow: 0 0 5px #bbdefb, 0 0 15px #90caf9, 0 0 30px #81d4fa;
  }
  50% {
    text-shadow: 0 0 10px #bbdefb, 0 0 25px #90caf9, 0 0 40px #81d4fa;
  }
`;

const blink = keyframes`
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.3; }
`;

const rippleAnimation = keyframes`
  0% { opacity: 0.5; transform: scale(0); }
  100% { opacity: 0; transform: scale(4); }
`;

// メイン オーバーレイコンポーネント (国際化対応)
interface MergedCosmicOverlayProps {
  isLoading: boolean;
}

const MergedCosmicOverlay = ({ isLoading }: MergedCosmicOverlayProps) => {
  // next-intl フック (仮に "Loading" ネームスペースを想定)
  const t = useTranslations("Loading");

  // クリックリップルエフェクト
  const [rippleArray, setRippleArray] = useState<
    { x: number; y: number; size: number; id: number }[]
  >([]);

  const handleClickRipple = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rippleSize = Math.max(window.innerWidth, window.innerHeight);
    const newRipple = {
      x: e.clientX - rippleSize / 2,
      y: e.clientY - rippleSize / 2,
      size: rippleSize,
      // === ここを修正 ===
      id: generateUniqueId(),
    };
    setRippleArray((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRippleArray((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1000);
  };

  // ランダムフラッシュ
  const [flashes, setFlashes] = useState<
    { id: number; left: number; top: number }[]
  >([]);

  useEffect(() => {
    let timeoutId: number;
    const createFlash = () => {
      // === ここを修正 ===
      const newId = generateUniqueId();
      setFlashes((prev) => [
        ...prev,
        { id: newId, left: Math.random() * 100, top: Math.random() * 100 },
      ]);
      // フラッシュ要素を1秒後に消す
      setTimeout(() => {
        setFlashes((prev) => prev.filter((f) => f.id !== newId));
      }, 1000);

      // 次回フラッシュまでの待機 (3～10秒程度)
      const nextDelay = Math.random() * 7000 + 3000;
      timeoutId = window.setTimeout(createFlash, nextDelay);
    };
    createFlash();
    return () => clearTimeout(timeoutId);
  }, []);

  // マウスパララックス
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const x = (e.clientX - window.innerWidth / 2) / 50;
      const y = (e.clientY - window.innerHeight / 2) / 50;
      setMouseOffset({ x, y });
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [handleMouseMove]);

  return (
    <Portal>
      <Fade in={isLoading}>
        <Flex
          position="fixed"
          top="0"
          left="0"
          width="100vw"
          height="100vh"
          align="center"
          justify="center"
          direction="column"
          overflow="hidden"
          zIndex={9999}
          // やわらかい青系のグラデーション
          bgGradient="linear(to-br, #e3f2fd, #e1f5fe, #e0f7fa)"
          bgSize="200% 200%"
          animation={`
            ${pastelBgMovement} ${BG_ANIM_DURATION} ease-in-out infinite,
            ${pastelHueShift} ${HUE_SHIFT_DURATION} linear infinite
          `}
          onClick={handleClickRipple}
        >
          {/* Three.js 背景 */}
          <ThreeCosmicBackground />

          {/* クリックリップルエフェクト */}
          {rippleArray.map((ripple) => (
            <Box
              key={ripple.id}
              position="fixed"
              left={ripple.x}
              top={ripple.y}
              width={`${ripple.size}px`}
              height={`${ripple.size}px`}
              borderRadius="50%"
              bg="rgba(255,255,255,0.5)"
              animation={`${rippleAnimation} ${RIPPLE_DURATION} ease-out`}
              pointerEvents="none"
              zIndex={10000}
            />
          ))}

          {/* やわらかい雲の渦巻きレイヤー */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width="250%"
            height="250%"
            bg="radial-gradient(circle, rgba(179,229,252,0.5), transparent 70%)"
            animation={`${pastelSwirl1} ${SWIRL1_DURATION} linear infinite`}
            zIndex={2}
            style={{ opacity: 0.6, transform: "translate(-50%, -50%)" }}
          />
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width="300%"
            height="300%"
            bg="radial-gradient(circle, rgba(224,247,250,0.3), transparent 80%)"
            animation={`${pastelSwirl2} ${SWIRL2_DURATION} linear infinite`}
            zIndex={2}
            style={{ opacity: 0.4, transform: "translate(-50%, -50%)" }}
          />

          {/* ランダムフラッシュ */}
          {flashes.map((flash) => (
            <Box
              key={flash.id}
              position="absolute"
              left={`${flash.left}%`}
              top={`${flash.top}%`}
              width="80px"
              height="80px"
              borderRadius="50%"
              bg="radial-gradient(circle, rgba(255,255,255,0.9), transparent 60%)"
              animation={`${sparkleFlash} 1s ease-out`}
              zIndex={3}
            />
          ))}

          {/* 妖精のキラキラ (元 comet) */}
          {Array.from({ length: 4 }).map((_, i) => {
            const randomDelay = (Math.random() * 3 + 1).toFixed(2);
            const startLeft = Math.random() * 100;
            const startTop = -10 - Math.random() * 10;
            const randomAngle = 30 + Math.random() * 30;
            return (
              <Box
                key={`fairyDust-${i}`}
                position="absolute"
                left={`${startLeft}vw`}
                top={`${startTop}vh`}
                width="3px"
                height="80px"
                bg="linear-gradient(to bottom, #ffffff, transparent)"
                filter="blur(1px)"
                style={{
                  transform: `rotate(${randomAngle}deg)`,
                  animation: `${fairyDust} ${FAIRY_DUST_DURATION} linear infinite`,
                  animationDelay: `${randomDelay}s`,
                }}
                zIndex={3}
              />
            );
          })}

          {/* 中央の 3D オーブ */}
          <Box
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%, -50%)"
            zIndex={4}
          >
            <ThreeCentralOrb />
          </Box>

          {/* ローディングメッセージ (国際化) */}
          <Text
            mt="6"
            fontSize="2xl"
            fontWeight="bold"
            color="#fff"
            animation={`${softNeonGlow} ${NEON_GLOW_DURATION} ease-in-out infinite`}
            textShadow="0 0 5px #bbdefb, 0 0 15px #90caf9, 0 0 30px #81d4fa"
            style={{
              transform: `perspective(800px) rotateX(${-mouseOffset.y / 5}deg) rotateY(${mouseOffset.x / 5}deg)`,
              transition: "transform 0.2s ease-out",
            }}
            zIndex={4}
          >
            {t("generatingPictureBook")}
            {/* 三点リーダーのドットを点滅させる */}
            <Box
              as="span"
              display="inline-block"
              animation={`${blink} ${BLINK_DURATION} infinite`}
              ml="1"
            >
              .
            </Box>
            <Box
              as="span"
              display="inline-block"
              animation={`${blink} ${BLINK_DURATION} infinite`}
              style={{ animationDelay: "0.3s" }}
              ml="1"
            >
              .
            </Box>
            <Box
              as="span"
              display="inline-block"
              animation={`${blink} ${BLINK_DURATION} infinite`}
              style={{ animationDelay: "0.6s" }}
              ml="1"
            >
              .
            </Box>
          </Text>
        </Flex>
      </Fade>
    </Portal>
  );
};

export default MergedCosmicOverlay;
