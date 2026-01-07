declare module "lunar-javascript" {
  export class Solar {
    static fromDate(date: Date): Solar;
    getLunar(): Lunar;
    getTerm(): string;
  }

  export class Lunar {
    getDayInChinese(): string;
    getMonthInChinese(): string;
    getFestivals(): string[];
  }

  export namespace HolidayUtil {
    function getHoliday(year: number, month: number, day: number): string | null;
  }
}
