from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
# Create your models here.

# 軟刪除管理器
class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

# 包含軟刪除的所有記錄管理器
class AllObjectsManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset()

# 使用者加入'最愛'
# 儲存使用者最愛的題目
# user_id: 使用者ID
# note_id: 題目ID
# created_at: 建立時間
# deleted_at: 刪除時間
class UserFavorite(models.Model):
    user = models.ForeignKey("Authorization.User", on_delete=models.CASCADE)
    note = models.ForeignKey("Topic.Note", on_delete=models.CASCADE , null=True, blank=True)
    topic = models.ForeignKey("Topic.Topic", on_delete=models.CASCADE,null=True, blank=True)
    quiz = models.ForeignKey("Topic.Quiz", on_delete=models.CASCADE,null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = "UserFavorite"
# 題目資料
# 儲存題目資訊
# quiz_topic: 題目名稱
# title: 題目標題
# option_a: 選項 A
# option_b: 選項 B
# option_c: 選項 C
# option_d: 選項 D
# Ai_answer: AI 答案
# User_answer: 使用者答案
# created_at: 建立時間
# deleted_at: 刪除時間
class Topic(models.Model):
    quiz_topic = models.ForeignKey("Topic.Quiz", on_delete=models.CASCADE)
    title = models.CharField(max_length=512)
    # 選項 A～D
    option_A = models.CharField(max_length=128, null=True, blank=True)
    option_B = models.CharField(max_length=128, null=True, blank=True)
    option_C = models.CharField(max_length=128, null=True, blank=True)
    option_D = models.CharField(max_length=128, null=True, blank=True)
    explanation_text = models.TextField(null=True, blank=True)  # 題目解釋文字
    Ai_answer = models.CharField(max_length=1,
        choices=[
            ('A', 'A'),
            ('B', 'B'),
            ('C', 'C'),
            ('D', 'D'),
            ('X', 'X')
        ], null=True, blank=True)  
    User_answer = models.CharField(max_length=1 , null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    difficulty= models.ForeignKey("Topic.DifficultyLevels", on_delete=models.CASCADE, null=True, blank=True)
    # 管理器
    objects = SoftDeleteManager()  # 預設只顯示未刪除的
    all_objects = AllObjectsManager()  # 顯示所有記錄（包含已刪除）
    
    class Meta:
        db_table = "Topic"

    def soft_delete(self):
        """軟刪除 Topic"""
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        """恢復軟刪除的 Topic"""
        self.deleted_at = None
        self.save()

# 考題題目
#儲存考題名稱
# quiz_topic: 考題名稱
# created_at: 建立時間
# updated_at: 更新時間
# deleted_at: 刪除時間
class Quiz(models.Model):
    quiz_topic = models.CharField(max_length=254)
    user = models.ForeignKey("Authorization.User", on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # 管理器
    objects = SoftDeleteManager()  # 預設只顯示未刪除的
    all_objects = AllObjectsManager()  # 顯示所有記錄（包含已刪除）
    
    class Meta:
        db_table = "Quiz"
    
    def soft_delete(self):
        """軟刪除 Quiz 及其相關的 Topic"""
        # 軟刪除自己
        self.deleted_at = timezone.now()
        self.save()
        
        # 軟刪除所有相關的 Topic
        topics = Topic.all_objects.filter(quiz_topic=self, deleted_at__isnull=True)
        for topic in topics:
            topic.soft_delete()
    
    def restore(self):
        """恢復軟刪除的 Quiz"""
        self.deleted_at = None
        self.save()
    
    @classmethod
    def soft_delete_old_quizzes_except_latest(cls, quiz_topic_name, latest_quiz_id):
        """軟刪除同名的舊 Quiz，保留最新的"""
        old_quizzes = cls.objects.filter(
            quiz_topic=quiz_topic_name
        ).exclude(id=latest_quiz_id)
        
        for quiz in old_quizzes:
            quiz.soft_delete()

# 使用者熟悉度
# 儲存使用者對考題的熟悉度
# user: 使用者ID
# quiz_topic: 考題ID
# note: 關聯的筆記ID
# difficultyLevels: 難度分類ID
# total_questions: 總題數
# correct_answers: 正確答案數量
# familiarity: 熟悉度
# updated_at: 更新時間
class UserFamiliarity(models.Model):
    user = models.ForeignKey("Authorization.User", on_delete=models.CASCADE)
    quiz_topic = models.ForeignKey("Topic.Quiz", on_delete=models.CASCADE)
    note = models.ForeignKey("Topic.Note", on_delete=models.CASCADE, null=True, blank=True)
    difficulty_level = models.ForeignKey("Topic.DifficultyLevels", on_delete=models.SET_NULL, null=True, blank=True)

    total_questions = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    correct_answers = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    # ★ 新增：難度加權累積（用 DecimalField 比較穩）
    weighted_total = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    weighted_correct = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    cap_weighted_sum = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))

    familiarity = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "UserFamiliarity"
        constraints = [
            models.UniqueConstraint(fields=["user", "quiz_topic"], name="uq_user_quiz_topic"),
            models.CheckConstraint(condition=models.Q(correct_answers__gte=0) & models.Q(total_questions__gte=0), name="ck_non_negative"),
            models.CheckConstraint(condition=models.Q(correct_answers__lte=models.F("total_questions")), name="ck_correct_le_total"),
        ]
        indexes = [ models.Index(fields=["user", "quiz_topic"]) ]


# 難度分類
# 儲存使用者熟悉度
# level_name: 難度名稱 
# familiarity_cap: 熟悉度上限
# weight_coefficients: 不同題型的權重係數
# created_at: 建立時間

class DifficultyLevels(models.Model):
    level_name = models.CharField(max_length=128, unique=True)
    familiarity_cap = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    weight_coefficients = models.JSONField(default=dict)  # 儲存不同題型的權重係數
    created_at = models.DateTimeField(auto_now_add=True)

        
# note 資料庫
# 儲存使用者筆記
# quiz_topic: 關聯的考題ID
# topic: 關聯的題目ID (保留可以新增空白筆記)
# title: 筆記標題 (保留可以新增空白筆記)
# user: 使用者ID
# content: 筆記內容 (保留可以新增空白筆記)
# retake: 是否再次測驗(針對筆記)
# retake_score_id: 再次測驗分數ID
# created_at: 建立時間
# updated_at: 更新時間
# deleted_at: 刪除時間
# 
class Note(models.Model):
    quiz_topic = models.ForeignKey("Topic.Quiz", on_delete=models.CASCADE)
    topic = models.ForeignKey("Topic.Topic", on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    user = models.ForeignKey("Authorization.User", on_delete=models.CASCADE)
    content = models.TextField(null=True, blank=True)
    is_retake = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # 管理器
    objects = SoftDeleteManager()  # 預設只顯示未刪除的
    all_objects = AllObjectsManager()  # 顯示所有記錄（包含已刪除）
    
    class Meta:
        db_table = "Note"
    
    def soft_delete(self):
        """軟刪除 Note"""
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        """恢復軟刪除的 Note"""
        self.deleted_at = None
        self.save()
# -----------------
# AI Chat 資料庫
# 儲存聊天內容
# note: 關聯的筆記ID
# user: 使用者ID
# content: 聊天內容
# sender: 發送者 (user 或 ai)預設為 ai
# created_at: 建立時間
# deleted_at: 刪除時間
# updated_at: 更新時間
class Chat(models.Model):
    topic = models.ForeignKey("Topic.Topic", on_delete=models.CASCADE)
    content = models.TextField()
    user = models.ForeignKey("Authorization.User", on_delete=models.CASCADE)
    sender = models.CharField(max_length=16, choices=[('user', 'User'), ('ai', 'AI')],default='ai')
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = "Chat"

# AI 提示資料庫
# 儲存 AI 提示內容
# prompt: 提示內容
# created_at: 建立時間
# updated_at: 更新時間

class AiPrompt(models.Model):
    prompt = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = "AiPrompt"



# 儲存用戶對 AI 互動的反饋
# user_id: 使用者ID
# feedback: 反饋內容
# feedback_score: 反饋分數
# prompt_id: 關聯的 AI 提示id
# created_at: 建立時間
class AiInteraction(models.Model):
    user = models.ForeignKey("Authorization.User", on_delete=models.CASCADE)
    feedback = models.TextField()
    feedback_score = models.IntegerField(default=0)
    prompt = models.ForeignKey("Topic.AiPrompt",on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "AiInteraction"
