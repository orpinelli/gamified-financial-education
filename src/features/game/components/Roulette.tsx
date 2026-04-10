"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const SECTORS = [1, 2, 3, 1, 2, 3]; // 6 sectors, 60° each
const SECTOR_COLORS = [
	"#22c55e", // green - 1
	"#3b82f6", // blue - 2
	"#f59e0b", // amber - 3
	"#16a34a", // darker green - 1
	"#2563eb", // darker blue - 2
	"#d97706", // darker amber - 3
];

interface RouletteProps {
	disabled?: boolean;
	onResult: (value: number) => void;
}

export function Roulette({ disabled, onResult }: RouletteProps) {
	const [spinning, setSpinning] = useState(false);
	const [rotation, setRotation] = useState(0);
	const [result, setResult] = useState<number | null>(null);
	const currentRotationRef = useRef(0);

	const spin = useCallback(() => {
		if (spinning || disabled) return;

		// Pick random sector index (0-5)
		const sectorIndex = Math.floor(Math.random() * 6);
		const value = SECTORS[sectorIndex];

		// Angle: each sector is 60°. The pointer is at top (270° in SVG terms).
		// We want sectorIndex * 60 to land at top.
		// Final angle = many full rotations + alignment
		const sectorAngle = sectorIndex * 60;
		// To stop at center of sector: add 30°
		const alignAngle = sectorAngle + 30;
		// Spin 8 full rounds + alignment
		const totalRotation = currentRotationRef.current + 360 * 8 + (360 - alignAngle);
		currentRotationRef.current = totalRotation;

		setResult(null);
		setSpinning(true);
		setRotation(totalRotation);

		// After animation completes (2.5s), show result
		setTimeout(() => {
			setSpinning(false);
			setResult(value ?? 1);
			setTimeout(() => {
				onResult(value ?? 1);
				setResult(null);
			}, 800);
		}, 2500);
	}, [spinning, disabled, onResult]);

	return (
		<div className="flex flex-col items-center gap-3">
			{/* Pointer */}
			<div className="text-2xl">▼</div>

			{/* Wheel */}
			<div className="relative">
				<svg
					width={180}
					height={180}
					viewBox="0 0 180 180"
					style={{
						transform: `rotate(${rotation}deg)`,
						transition: spinning
							? "transform 2.5s cubic-bezier(0.17, 0.67, 0.21, 0.99)"
							: "none",
					}}
				>
					{SECTORS.map((val, i) => {
						const startAngle = (i * 60 - 90) * (Math.PI / 180);
						const endAngle = ((i + 1) * 60 - 90) * (Math.PI / 180);
						const x1 = 90 + 80 * Math.cos(startAngle);
						const y1 = 90 + 80 * Math.sin(startAngle);
						const x2 = 90 + 80 * Math.cos(endAngle);
						const y2 = 90 + 80 * Math.sin(endAngle);
						const midAngle = ((i * 60 + 30 - 90) * Math.PI) / 180;
						const tx = 90 + 52 * Math.cos(midAngle);
						const ty = 90 + 52 * Math.sin(midAngle);

						return (
							<g key={i}>
								<path
									d={`M90,90 L${x1},${y1} A80,80 0 0,1 ${x2},${y2} Z`}
									fill={SECTOR_COLORS[i]}
									stroke="white"
									strokeWidth={2}
								/>
								<text
									x={tx}
									y={ty}
									textAnchor="middle"
									dominantBaseline="middle"
									fill="white"
									fontSize={22}
									fontWeight="bold"
								>
									{val}
								</text>
							</g>
						);
					})}
					{/* Center circle */}
					<circle cx={90} cy={90} r={14} fill="white" stroke="#e5e7eb" strokeWidth={2} />
				</svg>
			</div>

			{/* Result flash */}
			{result !== null && (
				<div className="text-3xl font-bold text-primary animate-bounce">
					+{result}
				</div>
			)}

			<Button
				size="lg"
				disabled={spinning || disabled}
				onClick={spin}
				className="min-w-[120px] text-base font-bold"
			>
				{spinning ? "Girando..." : "Rodar"}
			</Button>
		</div>
	);
}
