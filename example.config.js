module.exports = {
    accounts: [
        {
            localId: 1, // локальный айди (нигде не используется)
            id: 999, // айди юзера
            wss: "wss://paper-scroll.ru/socket?vk_access_token_settings=&vk_app_id=7420483&vk_are_notifications_enabled=0&vk_is_app_user=1&vk_is_favorite=0&vk_language=uk&vk_platform=mobile_iphone&vk_ref=other&vk_user_id=240965509&sign=wpEmRhTOi8nW1G9boghvxQuOClIUCxSUjyGEovMW123", // ws ссылка, можно узнать через inspect element -> network -> ws tab, а так же можно сформировать через vk.com/dev/apps.get 
            role: 'storage', // тип бота, [storage - автолечение от вируса, хранение баланса и поддержание онлайна, может быть посредником других storage | infected - заражает пользователей из топа, отправляя им бумагу | stealer - ждет время, когда можно воровать туалетку и грабит | miner - фармит кликами]
            autoBuyImprovements: true, // автопокупка улучшений настройка в index.js -> improvementsPlan
            transferUserId: 123, 
            isStorageMiddle: false, // если true - то будет пытаться передать все transferUserId, false - будет хранить баланс.
            keepInfected: false, // предотвратить исцеления
            debug: true, // показывает входящие и отправленные пакеты
        },
        {
            localId: 1,
            id: 777,
            wss: "wss://paper-scroll.ru/socket?vk_access_token_settings=&vk_app_id=7420483&vk_are_notifications_enabled=0&vk_is_app_user=1&vk_is_favorite=0&vk_language=uk&vk_platform=mobile_iphone&vk_ref=other&vk_user_id=240965509&sign=wpEmRhTOi8nW1G9boghvxQuOClIUCxSUjyGEovMW123",
            role: 'storage',
            autoBuyImprovements: false,
            transferUserId: 999,
            isStorageMiddle: true, //будет всю полученную бумагу передавать пользователю с id 999
            keepInfected: false,
            debug: true,
        },
        {
            localId: 2,
            id: 123,
            wss: "wss://paper-scroll.ru/socket?vk_access_token_settings=&vk_app_id=7420483&vk_are_notifications_enabled=0&vk_is_app_user=1&vk_is_favorite=0&vk_language=ru&vk_platform=mobile_iphone&vk_ref=other&vk_user_id=327421115&sign=f66knmw8zEpvPg3iFvjObhF9ISGrupaOoSXk_StN123",
            role: 'infected',
            autoBuyImprovements: false,
            transferUserId: 123,
            debug: true,
        },
        {
            localId: 7,
            id: 123,
            wss: "wss://paper-scroll.ru/socket?vk_access_token_settings=&vk_app_id=7420483&vk_are_notifications_enabled=0&vk_is_app_user=1&vk_is_favorite=0&vk_language=ru&vk_platform=mobile_iphone&vk_ref=other&vk_user_id=368728786&sign=6Cu5Z925aO4nSTEJbTYqrhZefdKLrNp0H8be5MO5123",
            role: 'stealer',
            autoBuyImprovements: false,
            transferUserId: 777,
            debug: true,
        },
        {
            localId: 7,
            id: 123,
            wss: "wss://paper-scroll.ru/socket?vk_access_token_settings=&vk_app_id=7420483&vk_are_notifications_enabled=0&vk_is_app_user=1&vk_is_favorite=0&vk_language=ru&vk_platform=mobile_iphone&vk_ref=other&vk_user_id=368728786&sign=6Cu5Z925aO4nSTEJbTYqrhZefdKLrNp0H8be5MO5123",
            role: 'stealer',
            autoBuyImprovements: false,
            transferUserId: 777,
            debug: true,
        },
        {
            localId: 0,
            id: 381871731,
            wss: "wss://paper-scroll.ru/socket?vk_access_token_settings=&vk_app_id=7420483&vk_are_notifications_enabled=0&vk_is_app_user=1&vk_is_favorite=0&vk_language=ru&vk_platform=mobile_iphone&vk_ref=other&vk_user_id=381871731&sign=kTwwWqoAPvuqkx3N428jPb6mn6hzwKC3Etsmcy4L3123",
            role: 'miner',
            autoBuyImprovements: true,
            autoBuyBonuses: true, // автопокупка бонусов, настройка в index.js -> bonusesPlan
            transferUserId: 123,
            debug: true,
        },
    ],
};



























