import { authenticateUser } from "./auth.service.js";

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const result = await authenticateUser(email, password);
    if (!result) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json(result);
  } catch (err) {
    console.error("Login failed", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export function logout(_req, res) {
  return res.status(200).json({ message: "Logged out" });
}

