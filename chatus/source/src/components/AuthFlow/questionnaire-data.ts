/** Original Figma 2988:5555 / 2995:14243 choices, in canvas order. */
export const AVATAR_BACKGROUNDS = [
  ['Оранжевый', '#FDAB1B', '#FF088E', '225%'],
  ['Синий', '#00B1FF', '#1008FF', '225%'],
  ['Розовый', '#FF7BAD', '#F70000', '225%'],
  ['Зелёный', '#3AEE15', '#084AFF', '225%'],
  ['Мятный', '#1BFDB9', '#B908FF', '225%'],
  ['Фуксия', '#FD1BAE', '#E6FF08', '225%'],
  ['Серый', '#89857E', '#474747', '73.924%'],
] as const;
export function avatarBackground(index: number) {
  const [, start, end, stop] = AVATAR_BACKGROUNDS[index] ?? AVATAR_BACKGROUNDS[0];
  return `linear-gradient(180deg, ${start} 0%, ${end} ${stop})`;
}
export const INTERESTS = [
  ['music', 'Музыка', 93], ['games', 'Игры', 74], ['sports', 'Спорт', 81], ['cinema', 'Кино', 73],
  ['books', 'Книги', 80], ['anime', 'Аниме', 85], ['meme', 'Мемы', 81],
  ['technology', 'Технологии и ИИ', 159], ['travel', 'Путешествие', 132],
  ['cook', 'Готовка', 91], ['fashion', 'Мода', 77], ['photo', 'Фото', 73],
  ['art', 'Искусство', 111], ['esotericism', 'Эзотерика', 113], ['pets', 'Питомцы', 104],
  ['role-playing', 'Ролевые игры', 136], ['flirting', 'Флирт', 82],
] as const;
export const SAMPLE_INTERESTS = ['music', 'technology', 'fashion', 'photo', 'pets'];
export function ageRange(age: number) {
  return age < 25 ? '18–24' : age < 35 ? '25–34' : age < 45 ? '35–44' : age < 55 ? '45–54' : age < 65 ? '55–64' : '65+';
}
