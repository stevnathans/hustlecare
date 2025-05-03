import axios from 'axios';

export const generateRequirements = async (businessIdea: string) => {
  const response = await axios.post('/api/generate', { businessIdea });
  return response.data.result;
};
