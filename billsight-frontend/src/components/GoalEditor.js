import React, { useState } from "react";
import api from "../api/axios";

const GoalEditor = ({ currentGoal, onClose, onGoalSaved }) => {
  const [value, setValue] = useState(currentGoal || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      await api.post("/user/goal", { monthly_goal: parseFloat(value) });
      onGoalSaved(parseFloat(value));
    } catch (e) {
      setErr("Could not save goal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99
    }}>
      <div style={{
        background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 6px 32px rgba(0,0,0,0.07)", minWidth: 300
      }}>
        <h3>Edit Monthly Goal</h3>
        <input
          type="number"
          value={value}
          min={0}
          onChange={e => setValue(e.target.value)}
          style={{ padding: 8, fontSize: 17, marginBottom: 12, width: "100%" }}
        />
        {err && <div style={{ color: "red", marginBottom: 10 }}>{err}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "7px 18px", borderRadius: 6, background: "#eee" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "7px 18px", borderRadius: 6, background: "#1976d2", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalEditor;      