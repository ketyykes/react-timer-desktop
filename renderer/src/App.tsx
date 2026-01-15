import { Timer } from "@/components/Timer";

const App = () => {
	return (
		<div className="h-full bg-white flex items-center justify-center p-6">
			<div className="w-full max-w-xs">
				<Timer />
			</div>
		</div>
	);
};

export default App;
