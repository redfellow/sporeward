import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { BALANCE } from "@sporeward/game";

export default function App() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Sporeward</Text>
			<Text style={styles.text}>Head out. Push back the spores.</Text>
			<Text style={styles.text}>Android recording experiment coming next.</Text>
			<Text style={styles.text}>Visit cooldown: {BALANCE.visitCooldownMs / 3_600_000} hours.</Text>
			<StatusBar style="light" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#112c23", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
	title: { color: "#e6f2ea", fontSize: 32, fontWeight: "600" },
	text: { color: "#a8c6b5", textAlign: "center" }
});
