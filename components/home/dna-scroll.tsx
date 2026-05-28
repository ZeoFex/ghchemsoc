"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import type { MotionValue } from "framer-motion";

export function DnaScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const totalFrames = 40;

    // Track scroll progress of the container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Smooth scroll progress for smoother animation
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Map scroll progress (0-1) to frame index (0 - totalFrames-1)
    const currentFrame = useTransform(smoothProgress, [0, 1], [0, totalFrames - 1]);

    // Preload images
    useEffect(() => {
        const loadImages = async () => {
            const loadedImages: HTMLImageElement[] = [];
            const promises = [];

            for (let i = 1; i <= totalFrames; i++) {
                const promise = new Promise((resolve, reject) => {
                    const img = new Image();
                    // Pad zeros: ezgif-frame-001.jpg, etc.
                    const formattedIndex = i.toString().padStart(3, "0");
                    img.src = `/dna-sequence/ezgif-frame-${formattedIndex}.jpg`;
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    loadedImages.push(img);
                });
                promises.push(promise);
            }

            try {
                await Promise.all(promises);
                // Sort to ensure order (promises might resolve out of order)
                loadedImages.sort((a, b) => {
                    const getNum = (str: string) => parseInt(str.match(/frame-(\d+)/)?.[1] || "0");
                    return getNum(a.src) - getNum(b.src);
                });
                setImages(loadedImages);
                setIsLoaded(true);
            } catch (error) {
                console.error("Failed to load images", error);
            }
        };

        loadImages();
    }, []);

    // Draw to canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || images.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = (index: number) => {
            // 1. Clamp index
            let frameIndex = Math.floor(index);
            if (frameIndex < 0) frameIndex = 0;
            if (frameIndex >= totalFrames) frameIndex = totalFrames - 1;

            const img = images[frameIndex];
            if (!img) return;

            // 2. Clear & Resize
            // Using a fixed aspect ratio or covering the screen?
            // Assuming images are consistent standard aspect, let's "cover" the canvas
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // 3. Draw Image (Cover logic)
            const hRatio = canvas.width / img.width;
            const vRatio = canvas.height / img.height;
            const ratio = Math.max(hRatio, vRatio);

            // If we want it contained instead of covered, use Math.min
            // const ratio = Math.min(hRatio, vRatio);

            const centerShift_x = (canvas.width - img.width * ratio) / 2;
            const centerShift_y = (canvas.height - img.height * ratio) / 2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff"; // White background to match image?
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(
                img,
                0,
                0,
                img.width,
                img.height,
                centerShift_x,
                centerShift_y,
                img.width * ratio,
                img.height * ratio
            );
        };

        // Initial render
        render(currentFrame.get());

        // Render on change
        const unsubscribe = currentFrame.on("change", (latest: number) => {
            requestAnimationFrame(() => render(latest));
        });

        return () => unsubscribe();
    }, [currentFrame, images]);

    return (
        <div ref={containerRef} className="relative h-[250vh] bg-white" data-aos="fade-up">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
                        <div className="h-10 w-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Canvas with Fade Overlay */}
                <div className="relative w-full h-full">
                    <canvas ref={canvasRef} className="block w-full h-full object-cover" />
                    {/* Gradient overlays to blend edges and improve contrast */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white opacity-40 pointer-events-none"></div>
                </div>

                {/* Text Overlays */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center z-10 px-6">
                    {/* Section 1 */}
                    <TextSection progress={scrollYProgress} start={0} end={0.25} align="center">
                        <div className="bg-white/60 backdrop-blur-md border border-white/40 p-8 rounded-3xl shadow-xl max-w-2xl">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                                Modern Healthcare Solutions
                            </h2>
                            <p className="text-lg text-gray-700 font-medium">
                                Providing world-class medical services with a touch of Ghanaian hospitality.
                            </p>
                        </div>
                    </TextSection>

                    {/* Section 2 */}
                    <TextSection progress={scrollYProgress} start={0.3} end={0.55} align="left">
                        <div className="bg-white/60 backdrop-blur-md border border-white/40 p-8 rounded-3xl shadow-xl max-w-xl">
                            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                                Expert Specialists
                            </h2>
                            <p className="text-lg text-gray-700 font-medium">
                                Our dedicated team of professionals helps you navigate every step of your recovery journey tailored just for you.
                            </p>
                        </div>
                    </TextSection>

                    {/* Section 3 */}
                    <TextSection progress={scrollYProgress} start={0.65} end={0.9} align="right">
                        <div className="bg-white/60 backdrop-blur-md border border-white/40 p-8 rounded-3xl shadow-xl max-w-xl">
                            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                                Community Focused
                            </h2>
                            <p className="text-lg text-gray-700 font-medium">
                                We are committed to building a healthier future for our families and community.
                            </p>
                        </div>
                    </TextSection>
                </div>
            </div>
        </div>
    );
}

function TextSection({
    progress,
    start,
    end,
    children,
    align = "center",
}: {
    progress: MotionValue<number>;
    start: number;
    end: number;
    children: React.ReactNode;
    align?: "center" | "left" | "right";
}) {
    const opacity = useTransform(progress,
        [start, start + 0.1, end - 0.1, end],
        [0, 1, 1, 0]
    );

    const y = useTransform(progress,
        [start, start + 0.1, end - 0.1, end],
        [50, 0, 0, -50]
    );

    const alignmentClasses = {
        center: "items-center text-center",
        left: "items-start text-left md:pl-24 self-start",
        right: "items-end text-right md:pr-24 self-end",
    };

    return (
        <motion.div
            style={{ opacity, y }}
            className={`absolute w-full max-w-7xl mx-auto flex flex-col ${alignmentClasses[align as keyof typeof alignmentClasses]}`}
        >
            {children}
        </motion.div>
    );
}
