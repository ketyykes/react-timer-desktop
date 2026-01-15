import { Timer } from "@/components/Timer";

const App = () => {
	return (
		<div className="min-h-svh p-2">
			<div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-4">
				<Timer />
			</div>
		</div>
	);
};

export default App;
