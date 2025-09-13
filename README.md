# README

插件地址：[Achuan-2/illustrator_sci_plugin](https://github.com/Achuan-2/illustrator_sci_plugin)

## 1 开发背景

之前为了组会做ppt快速排图、导入markdown笔记，写了一个ppt插件，开源在Github，目前star数已经超过500 stars：[Achuan-2/SlideSCI](https://github.com/Achuan-2/SlideSCI)，博客：[SlideSCI README](https://mp.weixin.qq.com/s/_NrGwjJnEta0oT5a6EKdiA)

最近在写论文，用adobe illustrator排图有时好累

- 比如我需要不同图同一个位置添加同一个标注，原生非常麻烦，因为只能获取绝对位置，得自己计算相对位置
- 比如我需要图片批量改宽高，全选图片后，输入具体值，但实际改的是整体大小，每个图片的大小并不是我输入的具体值
- 比如我要给图片添加label，一个个标签添加，要改编号，还要对齐也好累

## 2 功能介绍

- 复制粘贴相对位置：

  使用技巧
  - 手动设置两个对象的相对位置：修改ΔX和ΔY可以手动设置两个对象的相对位置，比如想让文字距离矩形左上角x方向2mm，y方向2mm
  - 复制一个对象的相对位置时，默认以画板为参考，这样可以先把一个形状移出去，然后对下面的形状进行改动，然后再粘贴回原来位置
  - 复制两个对象以上的相对位置，默认以第一个对象为参考对象，复制后面的对象对于第一个对象的相对位置，可以更改Order来调整对象顺序，插件支持根据垂直位置、水平位置以及图层顺序来确定对象顺序。如果你想以最后一个对象为参考对象，可以把“Reverse Order”打上勾，这样就是以最后一个对象为参考点
  - 当需要对多个对象进行跨画布统一位置时，勾选Artboard Reference

  使用场景
  - 手动设置两个对象的相对位置
  - 快速统一排列方式：如果已经排好了一组图，想对另一组图也按照之前那组图的排布方式排布，也可以一键复制并粘贴相对位置就瞬间排好了
  - 快速统一label位置：一个图加了label，其他图的label位置也需要一样，也可以快速统一
  - 可以基于画布复制多选形状的位置，进行跨画布统一位置

  <img alt="PixPin_2025-09-10_16-18-33" src="https://fastly.jsdelivr.net/gh/Achuan-2/PicBed@pic/assets/PixPin_2025-09-10_16-18-33-20250910161836-eiui89p.png" style="width: 214px;" />

  <br>
  <img alt="PixPin_2025-08-06_17-59-37" src="https://github.com/user-attachments/assets/6a85f732-a325-4864-a7af-5cb9dc0796e4" width="70%"/>

​
- 形状大小批量复制：

  复制一个形状的宽高或者手动输入宽高，点击Paste Size即可对选择的形状进行批量粘贴形状。

  宽高前有勾选框，默认全部勾选，只勾选其中一个，比如只勾选宽度则只粘贴宽度，高度根据原来宽高比自动调整

  <img alt="PixPin_2025-08-06_17-56-39" src="https://fastly.jsdelivr.net/gh/Achuan-2/PicBed@pic/assets/PixPin_2025-08-06_17-56-39-20250806175650-enk1w8e.png" style="width: 278px;" />​
- 一键排列图片：可以批量调整图片宽高、一键排列整齐

  - Column：设置要排成几列
  - Row Gap：行间距
  - Column Gap：列间距
  - Resize Width：如果打上勾，会统一设置所有对象的Width
  - Resize Height：如果打上勾，会统一设置所有对象的Height
  - Order：判断对象的先后顺序，插件支持根据垂直位置、水平位置以及图层顺序来确定对象顺序。

  <img alt="PixPin_2025-08-06_17-59-37" src="https://fastly.jsdelivr.net/gh/Achuan-2/PicBed@pic/assets/PixPin_2025-08-06_17-59-37-20250806175940-zw3soci.png" style="width: 298px;" />
  <br>
  <img alt="PixPin_2025-08-06_17-59-37" src="https://github.com/user-attachments/assets/3baad6da-798d-449b-9023-69c8698db78e" width="70%"/>

​
- 交换两个形状的位置

  用途

  - 一组图已经排版好，复制一份，然后用swap position功能，把新图和原来的图替换
  - 组图后需要修改，交换两个图的位置

  <img alt="PixPin_2025-08-09_22-50-15" src="https://fastly.jsdelivr.net/gh/Achuan-2/PicBed@pic/assets/PixPin_2025-08-09_22-50-15-20250809225017-bwuzfj6.png" style="width: 453px;" />
  <br>
  <img alt="PixPin_2025-08-06_17-59-37" src="https://github.com/user-attachments/assets/b1024d68-50e9-402a-9034-8ffc22f5947b" />

​
- 一键添加label

  使用技巧

  - 添加label后，offset 输入框变红，修改值就会自动实时更改label offset，还支持鼠标滚动修改，要退出这个状态只需要随意点击其他按钮、输入框即可

  <img alt="PixPin_2025-09-10_16-34-58" src="https://fastly.jsdelivr.net/gh/Achuan-2/PicBed@pic/assets/PixPin_2025-09-10_16-34-58-20250910163500-46cw2gv.png" />
  <br>
  <img alt="PixPin_2025-09-10_16-09-36" src="https://fastly.jsdelivr.net/gh/Achuan-2/PicBed@pic/assets/PixPin_2025-09-10_16-09-36-20250910163518-gs9tdog.gif" />

## 3 如何使用本插件

1. 下载插件zip或zxp文件（选一个就好）：[https://github.com/Achuan-2/illustrator_sci_plugin/releases](https://github.com/Achuan-2/illustrator_sci_plugin/releases)

    <img width="1521" height="461" alt="PixPin_2025-09-13_09-24-45" src="https://github.com/user-attachments/assets/69ef348b-2ab4-4c69-9670-2b77573581bb" />


2. 安装方法

    【方法一:zxp文件安装】

    下载zxp文件后，安装[ZXP/UXP Installer](https://aescripts.com/learn/zxp-installer/?srsltid=AfmBOoo-EVsObqPpzaZW0PvdAs_QcLleVQPtl2Yy00HAkA4rzndfdAcI)，打开软件拖进zxp文件进行安装

    <img alt="PixPin_2025-09-10_20-49-35" src="https://github.com/user-attachments/assets/d2b7c2a6-65f6-438a-9b52-5ce08b614717" style="width: 50%;" />

    <img alt="PixPin_2025-09-13_09-22-10" src="https://github.com/user-attachments/assets/3abec6d2-b8ef-4e5e-ad24-3e0bc68a9f0c" style="width: 50%;" />

    <img alt="PixPin_2025-09-13_09-22-15" src="https://github.com/user-attachments/assets/bf0359aa-f05c-4a88-97f0-9196a83b93ea" style="width: 50%;" />
    
    【方法二：zip文件安装】

    下载zip文件后，解压为文件夹，复制到Adobe 插件文件夹

    - windows：

      - 32位版本：`C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`
      - 64位版本：`C:\Program Files\Common Files\Adobe\CEP\extensions`（illustrator版本比较新一般都是64位版本，32位版本应该都是比较老的版本）

      <img alt="PixPin_2025-08-06_12-07-37" src="https://fastly.jsdelivr.net/gh/Achuan-2/PicBed@pic/assets/PixPin_2025-08-06_12-07-37-20250806120739-cquahfa.png" style="width: 50%;" />
    - MacOS

      - 系统目录：`/Library/Application Support/Adobe/CEP/extensions`
      - 用户目录：`~/Library/Application Support/Adobe/CEP/extensions`
    - 如何判断路径正确，如果打开的路径正确，文件夹是本来就存在的，并且里面有一些文件夹
    
    如果打开插件后显示页面空白，需要额外设置PlayerDebugMode，才能使用本插件

   启用允许开发者扩展（PlayerDebugMode=1）步骤
    
    - Windows解决方法
    
      - `win+r`输入`regedit`，打开注册表
      - 找到`计算机\HKEY_CURRENT_USER\Software\Adobe\`（可以直接在地址栏粘贴跳转）下的`CSXS.版本号`文件夹：新建字符串，名称为 PlayerDebugMode，然后双击输入值为1。如果CSXS有多个版本，最好每个版本都复制下PlayerDebugMode文件
    
        <img width="1902" height="1103" alt="image" src="https://github.com/user-attachments/assets/9d2e4b7d-201b-48e6-95ea-4dc02bdf0986" />

    - Mac系统解决方法
    
      - 打开终端，输入
    
        ```bash
        defaults write com.adobe.CSXS.版本号 PlayerDebugMode 1
        ```
    
        如
    
        ```bash
        defaults write com.adobe.CSXS.4 PlayerDebugMode 1
        defaults write com.adobe.CSXS.5 PlayerDebugMode 1
        defaults write com.adobe.CSXS.6 PlayerDebugMode 1
        defaults write com.adobe.CSXS.7 PlayerDebugMode 1
        defaults write com.adobe.CSXS.8 PlayerDebugMode 1
        defaults write com.adobe.CSXS.9 PlayerDebugMode 1
        defaults write com.adobe.CSXS.10 PlayerDebugMode 1
        defaults write com.adobe.CSXS.11 PlayerDebugMode 1
        defaults write com.adobe.CSXS.12 PlayerDebugMode 1
        ```
    
        > 如果不知道你的版本号，其实可以把4到12都设置一个遍
        >



4. 打开插件

    - 窗口-扩展功能，选择本插件

      <img alt="PixPin_2025-08-06_13-25-43" src="https://fastly.jsdelivr.net/gh/Achuan-2/PicBed@pic/assets/PixPin_2025-08-06_13-25-43-20250806132550-sz59wup.png" />
    - 窗口可以拖拽到侧栏方便使用

      <img alt="PixPin_2025-08-06_13-26-22" src="https://fastly.jsdelivr.net/gh/Achuan-2/PicBed@pic/assets/PixPin_2025-08-06_13-26-22-20250806132631-ib04jm0.png" style="width: 384px;" />​

## ❤️用爱发电

如果喜欢我的作品，欢迎给我买杯咖啡，这会激励我继续维护项目和持续创作新项目。

个人时间和精力有限，优先考虑赞赏用户提的功能建议和bug反馈

累积赞赏50元的朋友如果想加我微信，可以发邮件到achuan-2@outlook.com来进行好友申请（赞赏达不到50元的，我不会回复邮件和加好友哦，因为不想当免费客服）

<img alt="" src="https://camo.githubusercontent.com/8cf1ad8251e7cecf3dbd2f818706e8aad08aeab824c8bed49b6826f2df443000/68747470733a2f2f63646e2e6e6c61726b2e636f6d2f79757175652f302f323032342f6a7065672f313430383034362f313731343735343537333339332d39633766373062302d303565632d343839652d623561322d3161333766623638316636662e6a7065673f782d6f73732d70726f636573733d696d616765253246666f726d617425324377656270253246696e7465726c61636525324331" style="width: 450px;" />
