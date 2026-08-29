import { apiClient as client } from "../client";

export const experienceService = {
  async getExperiences() {
    const response = await client.get("/experiences/");
    return response.data;
  },

  async markExperienced(experienceId) {
    const response = await client.post(
      `/experiences/${experienceId}/mark-experienced`,
    );
    return response.data;
  },

  async addReview(experienceId, rating, content) {
    const response = await client.post(`/experiences/${experienceId}/review`, {
      rating,
      content,
    });
    return response.data;
  },
};
