import { readFile } from "node:fs/promises";

const REGISTRY_URL = new URL("../backend/registries/mfam_family_conformance.json", import.meta.url);

export async function loadFamilyConformanceRegistry() {
  return JSON.parse(await readFile(REGISTRY_URL, "utf8"));
}

export function evaluateFamilyCandidate(registry, faceId) {
  const evaluation = registry.evaluations.find((item) => item.faceId === faceId);
  if (!evaluation) return null;
  const contract = registry.contracts.find((item) => item.contractId === evaluation.contractId);
  if (!contract) throw new Error(`Missing family conformance contract for ${faceId}`);

  const evidenceByGate = new Map(evaluation.gateEvidence.map((item) => [item.gateId, item]));
  const gateResults = contract.requiredGates.map((gate) => {
    const evidence = evidenceByGate.get(gate.gateId);
    return {
      gateId: gate.gateId,
      scope: gate.scope,
      status: evidence?.status || "UNRESOLVED",
      basis: evidence?.basis || "No evidence record supplied.",
      failureCode: evidence?.status === "PROVEN" ? null : gate.failureCode
    };
  });
  const missingGateIds = gateResults.filter((gate) => gate.status !== "PROVEN").map((gate) => gate.gateId);
  const calculatedDisposition = missingGateIds.length === 0 && evaluation.targetProfileId ? "ADMITTED" : "HOLD";
  if (calculatedDisposition !== evaluation.disposition) {
    throw new Error(`${faceId} disposition does not match its gate evidence`);
  }
  if (evaluation.disposition === "ADMITTED" && evaluation.irreducibleMissingFacts.length) {
    throw new Error(`${faceId} cannot be admitted with unresolved facts`);
  }
  if (evaluation.disposition === "HOLD" && !evaluation.irreducibleMissingFacts.length) {
    throw new Error(`${faceId} HOLD must name its irreducible missing fact`);
  }
  return {...evaluation, gateResults, missingGateIds, calculatedDisposition};
}

export function runFamilyAdmissionBatch(registry, contractId, faceIds) {
  const results = faceIds.map((faceId) => evaluateFamilyCandidate(registry, faceId));
  if (results.some((result) => !result)) throw new Error("Family admission batch contains an unknown face");
  if (results.some((result) => result.contractId !== contractId)) {
    throw new Error("Family admission batch crosses conformance contracts");
  }
  return {
    contractId,
    candidatesEvaluated: results.length,
    admitted: results.filter((result) => result.disposition === "ADMITTED"),
    held: results.filter((result) => result.disposition === "HOLD"),
    results
  };
}

export async function verifyFamilyConformanceRegistry(authorityRegistry) {
  const registry = await loadFamilyConformanceRegistry();
  if (registry.authorityRegistryId !== authorityRegistry.registryId) {
    throw new Error("Family conformance registry points at a different authority registry");
  }
  const contractIds = new Set(registry.contracts.map((contract) => contract.contractId));
  if (contractIds.size !== registry.contracts.length) throw new Error("Duplicate family conformance contract");
  const faceIds = new Set();
  for (const evaluation of registry.evaluations) {
    if (faceIds.has(evaluation.faceId)) throw new Error(`Duplicate conformance evaluation ${evaluation.faceId}`);
    faceIds.add(evaluation.faceId);
    evaluateFamilyCandidate(registry, evaluation.faceId);
  }
  const admittedProfileIds = new Set(
    registry.evaluations
      .filter((evaluation) => evaluation.disposition === "ADMITTED")
      .map((evaluation) => evaluation.targetProfileId)
  );
  const familyProfileIds = new Set(
    authorityRegistry.targetProfileBindings
      .filter((binding) => binding.familyAuthorityPackageId)
      .map((binding) => binding.targetProfileId)
  );
  if ([...familyProfileIds].some((profileId) => !admittedProfileIds.has(profileId))) {
    throw new Error("A governed family Target Profile lacks a passing conformance evaluation");
  }
  if ([...admittedProfileIds].some((profileId) => !familyProfileIds.has(profileId))) {
    throw new Error("A conformance admission lacks an explicit governed Target Profile binding");
  }
  return registry;
}
