# README

插件地址：[Achuan-2/illustrator_sci_plugin](https://github.com/Achuan-2/illustrator_sci_plugin)

## 1 开发背景

之前为了组会做ppt快速排图、导入markdown笔记，写了一个ppt插件，开源在Github，目前star数已经超过450 stars：[Achuan-2/SlideSCI](https://github.com/Achuan-2/SlideSCI)

最近在写论文，用adobe illustrator排图有时好累

- 比如我需要不同图同一个位置添加同一个标注，原生非常麻烦，因为只能获取绝对位置，得自己计算相对位置
- 比如我需要图片批量改宽高，全选图片后，输入具体值，但实际改的是整体大小，每个图片的大小并不是我输入的具体值

## 2 功能介绍

- 复制粘贴相对位置：快速实现不同图同一个位置添加同一个标注，一个图排版好，就可以复制粘贴给其他图

  ![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20250806121358-036gmd6.png)​
- 一键排列图片：可以批量调整图片宽高、一键排列整齐

  ![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20250806121535-4wmql7s.png)​
- 一键添加label

  ![image](https://assets.b3logfile.com/siyuan/1610205759005/assets/image-20250806121541-0tppy18.png)​

## 3 如何使用本插件

1. 下载插件zip

    ![PixPin_2025-08-06_12-07-53](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2025-08-06_12-07-53-20250806120759-910uvu0.png)
2. 解压，复制插件文件夹到Adobe 插件文件夹

    - windows

      - 32位版本：`C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`​
      - 64位版本：`C:\Program Files\Common Files\Adobe\CEP\extensions`（illustrator版本比较新的一般都是64位版本，32位版本应该都是比较老的版本）

      ![PixPin_2025-08-06_12-07-37](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2025-08-06_12-07-37-20250806120739-cquahfa.png)

    - MacOS

      - 系统目录：`/Library/Application Support/Adobe/CEP/extensions`​
      - 用户目录：`~/Library/Application Support/Adobe/CEP/extensions`​
3. 由于插件没有打包，需要额外设置PlayerDebugMode，才能使用本插件

    启用允许开发者扩展（PlayerDebugMode=1）步骤

    - windows解决方法

      - ​`win+r`输入`regedit`，打开注册表
      - 找到`计算机\HKEY_CURRENT_USER\Software\Adobe\`（可以直接在地址栏粘贴跳转）+`CSXS.版本号`：新建字符串，名称为 PlayerDebugMode，然后双击输入值为1。

        ![PixPin_2025-08-06_09-54-07](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2025-08-06_09-54-07-20250806095411-4s02uhq.png)
    - Mac系统解决方法

      - 打开终端，输入

        ```bash
        defaults write com.adobe.CSXS.版本号 PlayerDebugMode 1
        ```

        如

        ```bash
        defaults write com.adobe.CSXS.10 PlayerDebugMode 1
        defaults write com.adobe.CSXS.11 PlayerDebugMode 1
        defaults write com.adobe.CSXS.12 PlayerDebugMode 1
        ```
4. 打开插件

    - 窗口-扩展功能，选择本插件

      ![PixPin_2025-08-06_13-25-43](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2025-08-06_13-25-43-20250806132550-sz59wup.png)
    - 窗口可以拖拽到侧栏方便使用

      ![PixPin_2025-08-06_13-26-22](https://assets.b3logfile.com/siyuan/1610205759005/assets/PixPin_2025-08-06_13-26-22-20250806132631-ib04jm0.png)​

## ❤️用爱发电

如果喜欢我的作品，欢迎给我买杯咖啡，这会激励我继续维护项目和持续创作新项目。

个人时间和精力有限，优先考虑赞赏用户提的功能建议和bug反馈

![](https://camo.githubusercontent.com/8cf1ad8251e7cecf3dbd2f818706e8aad08aeab824c8bed49b6826f2df443000/68747470733a2f2f63646e2e6e6c61726b2e636f6d2f79757175652f302f323032342f6a7065672f313430383034362f313731343735343537333339332d39633766373062302d303565632d343839652d623561322d3161333766623638316636662e6a7065673f782d6f73732d70726f636573733d696d616765253246666f726d617425324377656270253246696e7465726c61636525324331)
