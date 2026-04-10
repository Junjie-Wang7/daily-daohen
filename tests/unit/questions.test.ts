import { describe, expect, it } from "vitest";
import { countAnsweredQuestions } from "@/lib/questions";

describe("question helpers", () => {
  it("counts answered questions for progress feedback", () => {
    expect(
      countAnsweredQuestions({
        event: "事情经过",
        reaction: "第一反应",
        thought: "",
        fear: "",
        reason: "自洽",
        stone: "",
        choice: "",
      }),
    ).toBe(3);
  });
});
