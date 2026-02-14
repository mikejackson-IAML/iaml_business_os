interface ApiUsageParams {
  department: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  projectId?: string;
}

export function logApiUsage(params: ApiUsageParams): void {
  // TODO: implement usage tracking persistence
  console.log(`[API Usage] ${params.department}/${params.feature}: ${params.inputTokens}in/${params.outputTokens}out`);
}
