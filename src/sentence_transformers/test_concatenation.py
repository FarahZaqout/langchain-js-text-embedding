import unittest
import csv

from ensemble_voting_concat import match_questions, questions, user_inputs


class TestQuestionMatching(unittest.TestCase):

    def setUp(self):
        self.csv_file = open("src/sentence_transformers/concatenation_mismatches.csv", "w", newline='')
        self.csv_writer = csv.writer(self.csv_file)
        # Writing the headers for the CSV file
        self.csv_writer.writerow(["User Input", "Top Matched Question", "2nd Matched Question", "3rd Matched Question"])

    def test_matching(self):
        full_matches = 0

        for idx, user_input in enumerate(user_inputs):
            print(f"\nMatching for input: {user_input}")
            results = match_questions(questions, user_input)
            self.assertTrue(results)  # Ensure there's always a result

            top_match_question = results[0]["question"]
            expected_question = questions[idx]

            if results[0]["similarity"] < 0.65:
                similarity_scores = [res["similarity"] for res in results[:3]]
                csv_row = [user_input, f'"{results[0]["question"]}" with score {similarity_scores[0]:.3f}']

                for score in similarity_scores[1:]:
                    csv_row.append(f'Score: {score:.3f}')
                while len(csv_row) < 4:
                    csv_row.append("N/A")

                self.csv_writer.writerow(csv_row)
            elif top_match_question != expected_question:
                self.csv_writer.writerow([user_input,
                                          results[0]["question"] if len(results) > 0 else "N/A",
                                          results[1]["question"] if len(results) > 1 else "N/A",
                                          results[2]["question"] if len(results) > 2 else "N/A"])
            else:
                full_matches += 1

        print(f"\nTotal full matches: {full_matches}/{len(user_inputs)}")
        match_percentage = (full_matches / len(user_inputs)) * 100
        print(f"Match percentage: {match_percentage:.2f}%")

    def tearDown(self):
        self.csv_file.close()


if __name__ == "__main__":
    unittest.main()
