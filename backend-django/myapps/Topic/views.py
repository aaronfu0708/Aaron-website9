
from django.shortcuts import render , get_object_or_404
from django.http import JsonResponse
from .serializers import UserFavoriteSerializer, TopicSerializer,  NoteSerializer, ChatSerializer, AiPromptSerializer ,AiInteractionSerializer ,QuizSerializer, UserFamiliaritySerializer, DifficultyLevelsSerializer , QuizSimplifiedSerializer ,UserFamiliaritySimplifiedSerializer , NoteSimplifiedSerializer , TopicSimplifiedSerializer , AddFavoriteTopicSerializer
from .models import UserFavorite, Topic,  Note, Chat, AiPrompt,AiInteraction , Quiz , UserFamiliarity, DifficultyLevels
from myapps.Authorization.serializers import UserSerializer
from myapps.Authorization.models import User
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny , IsAuthenticated
from rest_framework.decorators import api_view , permission_classes
from django.utils import timezone
from rest_framework.response import Response
from django.db import transaction
import os , requests

FLASK_BASE_URL = os.getenv("FLASK_BASE_URL", "http://localhost:5000")
DJANGO_BASE_URL = os.getenv("DJANGO_BASE_URL", "http://localhost:8000")
# Create your views here.

# flask api接口
# 產生題目和取得題目
class QuizViewSet(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # 傳給 Flask 做處理
            flask_response = requests.post(
                f'{FLASK_BASE_URL}/api/quiz',
                json=request.data  # 傳遞請求資料
            )
            
            # 檢查 Flask 響應狀態
            if flask_response.status_code != 201:
                return Response({
                    'error': f'Flask service error: {flask_response.status_code}',
                    'details': flask_response.text
                }, status=500)
            
            result = flask_response.json()
            
            # 調試: 印出 Flask 回應
            print(f"=== Flask API 回應 ===")
            print(f"回應狀態碼: {flask_response.status_code}")
            print(f"回應內容: {result}")
            print(f"題目數量: {len(result.get('questions', []))}")
            for i, q in enumerate(result.get('questions', []), 1):
                print(f"題目 {i}: {q.get('title', 'No title')}")
            print("=" * 50)
            
            # 從請求中獲取 user_id（可能來自 Flask 的回應或原始請求）
            user_id = request.data.get('user_id') or result.get('user')
            user_instance = None
            
            # 如果有 user_id，取得 User 實例
            try:
                user_instance = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': f'User with ID {user_id} not found'
                }, status=400)
            
            # 返回結果 寫回資料庫
            # 先判斷 quiz_topic 是否有未軟刪除的 Quiz，有則不再新建
            quiz_topic_name = result.get('quiz_topic')
            quiz = Quiz.objects.filter(quiz_topic=quiz_topic_name, user_id=user_id, deleted_at__isnull=True).first()
            if quiz:
                print(f"Found existing Quiz: {quiz.quiz_topic} (ID: {quiz.id}) for user: {user_instance}")
            else:
                quiz = Quiz.objects.create(
                    quiz_topic=quiz_topic_name,
                    user=user_instance
                )
                print(f"Created new Quiz: {quiz.quiz_topic} (ID: {quiz.id}) for user: {user_instance}")
                
                # 自動添加到用戶收藏
                try:
                    UserFavorite.objects.create(
                        user=user_instance,
                        quiz=quiz
                    )
                    print(f"✅ 自動添加Quiz到用戶收藏: {quiz.quiz_topic}")
                except Exception as e:
                    print(f"⚠️ 添加收藏失敗: {str(e)}")
                    # 不阻止主流程繼續
            
            # 然後創建 Topic，並關聯到 Quiz
            topics = []
            new_topic_ids = []
            print(f"=== 開始創建 Topic ===")
            print(f"準備創建 {len(result.get('questions', []))} 個 Topic")
            
            for i, q in enumerate(result.get('questions', []), 1):
                print(f"創建第 {i} 個 Topic: {q.get('title', 'No title')}")
                
                # 處理難度等級
                difficulty_id = q.get('difficulty_id', 1)
                try:
                    difficulty_instance = DifficultyLevels.objects.get(id=difficulty_id)
                except DifficultyLevels.DoesNotExist:
                    difficulty_instance = DifficultyLevels.objects.get(id=1)  # 預設 beginner
                
                topic = Topic.objects.create(
                    quiz_topic=quiz,  # 關聯到 Quiz 實例
                    title=q.get('title'),
                    option_A=q.get('option_A'),
                    option_B=q.get('option_B'),
                    option_C=q.get('option_C'),
                    option_D=q.get('option_D'),
                    difficulty=difficulty_instance,  # 使用 difficulty 外鍵
                    Ai_answer=q.get('Ai_answer'),
                    explanation_text=q.get('explanation_text')
                )
                topics.append(topic)
                new_topic_ids.append(topic.id)
                print(f"成功創建 Topic ID: {topic.id}")
            
            print(f"總共創建了 {len(topics)} 個 Topic")
            print("=" * 50)

            # 重新從資料庫獲取 quiz 實例以確保最新資料
            quiz.refresh_from_db()
            
            # 序列化返回資料
            quiz_serializer = QuizSerializer(quiz)
            topics_serializer = TopicSerializer(topics, many=True)

            return Response({
                "quiz": quiz_serializer.data,
                "topics": topics_serializer.data,
                "message": f"Successfully created {len(topics)} topics"
            })

        except requests.exceptions.ConnectionError:
            return Response({
                'error': 'Cannot connect to Flask service. Make sure it is running on port 5000.'
            }, status=503)
        except Exception as e:
            return Response({
                'error': f'Internal server error: {str(e)}'
            }, status=500)
    
    def get(self, request):
        # 直接從 Django 資料庫獲取資料，不調用 Flask
        try:
            # 獲取當前用戶的所有 Quiz 和相關的 Topic
            quizzes = Quiz.objects.filter(user=request.user, deleted_at__isnull=True)
            print(f"=== GET 方法除錯 ===")
            print(f"用戶: {request.user}")
            print(f"找到 {quizzes.count()} 個 Quiz")
            
            quiz_list = []
            for quiz in quizzes:
                # 獲取該 Quiz 相關的 Topics
                topics = Topic.objects.filter(quiz_topic=quiz)
                
                quiz_data = {
                    'id': quiz.id,
                    'quiz_topic': quiz.quiz_topic,
                    'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                    'topics': []
                }
                
                for topic in topics:
                    topic_data = {
                        'id': topic.id,
                        'title': topic.title,
                        'User_answer': topic.User_answer,
                        'Ai_answer': topic.Ai_answer,
                        'explanation_text': topic.explanation_text,
                        'difficulty_id': topic.difficulty_id,
                        'created_at': topic.created_at.isoformat() if topic.created_at else None
                    }
                    quiz_data['topics'].append(topic_data)
                
                quiz_list.append(quiz_data)
            
            return Response(quiz_list)
            
        except Exception as e:
            return Response({
                'error': f'Internal server error: {str(e)}'
            }, status=500)

# 根據題目ID獲取單個題目詳細資料
class TopicDetailViewSet(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, topic_id):
        """根據題目ID獲取題目詳細資料"""
        try:
            # 獲取單個 Topic
            topic = Topic.objects.select_related('quiz_topic').get(
                id=topic_id, 
                deleted_at__isnull=True
            )
            
            # 構建返回資料
            topic_data = {
                'id': topic.id,
                'title': topic.title,
                'option_A': topic.option_A,
                'option_B': topic.option_B,
                'option_C': topic.option_C,
                'option_D': topic.option_D,
                'User_answer': topic.User_answer,
                'explanation_text': topic.explanation_text,
                'difficulty_id': topic.difficulty_id,
                'Ai_answer': topic.Ai_answer,
                'created_at': topic.created_at.isoformat() if topic.created_at else None,
                'quiz': {
                    'id': topic.quiz_topic.id,
                    'quiz_topic': topic.quiz_topic.quiz_topic,
                    'created_at': topic.quiz_topic.created_at.isoformat() if topic.quiz_topic.created_at else None
                }
            }
            
            return Response(topic_data)
            
        except Topic.DoesNotExist:
            return Response({
                'error': f'Topic with ID {topic_id} not found'
            }, status=404)
        except Exception as e:
            return Response({
                'error': f'Internal server error: {str(e)}'
            }, status=500)



# 根據Quiz ID獲取該Quiz下的所有題目
class QuizTopicsViewSet(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, quiz_id):
        """根據Quiz ID獲取該Quiz下的所有題目"""
        try:
            # 檢查 Quiz 是否存在
            quiz = Quiz.objects.get(id=quiz_id, deleted_at__isnull=True)
            
            # 獲取該 Quiz 下的所有 Topics
            topics = Topic.objects.filter(
                quiz_topic=quiz,
                deleted_at__isnull=True
            ).order_by('created_at')
            
            # 構建返回資料
            quiz_data = {
                'id': quiz.id,
                'user': quiz.user.id if quiz.user else None,
                'quiz_topic': quiz.quiz_topic,
                'created_at': quiz.created_at.isoformat() if quiz.created_at else None,
                'topics': []
            }
            
            for topic in topics:
                topic_data = {
                    'id': topic.id,
                    'title': topic.title,
                    'option_A': topic.option_A,
                    'option_B': topic.option_B,
                    'option_C': topic.option_C,
                    'option_D': topic.option_D,
                    'User_answer': topic.User_answer,
                    'explanation_text': topic.explanation_text,
                    'Ai_answer': topic.Ai_answer,
                    'created_at': topic.created_at.isoformat() if topic.created_at else None,
                    'difficulty_id': topic.difficulty_id
                }
                quiz_data['topics'].append(topic_data)
            
            return Response(quiz_data)
            
        except Quiz.DoesNotExist:
            return Response({
                'error': f'Quiz with ID {quiz_id} not found'
            }, status=404)
        except Exception as e:
            return Response({
                'error': f'Internal server error: {str(e)}'
            }, status=500)
    def patch(self, request , quiz_id):

        new_quiz_topic = request.data.get('new_quiz_topic')
        if not new_quiz_topic:
            return Response({'error': 'new_quiz_topic is required'}, status=400)

        try:
            quiz = Quiz.objects.get(id=quiz_id, deleted_at__isnull=True)
            quiz.quiz_topic = new_quiz_topic
            quiz.save()
            return Response({'message': 'Quiz updated successfully'}, status=200)
        except Quiz.DoesNotExist:
            return Response({'error': f'Quiz with ID {quiz_id} not found'}, status=404)
        except Exception as e:
            return Response({'error': f'Internal server error: {str(e)}'}, status=500)

# 前端回傳要收藏的題目 加入到 userfavorites 和 note
class AddFavoriteViewSet(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            user = request.data.get('user_id')  # 從請求中獲取當前使用者
            content = request.data.get('content')
            topic = request.data.get('topic_id')
            print(f"~~~~~ 使用者: {user} ,回傳內容: {content}  , 使用題目: {topic} ~~~~~")
            if not user:
                return Response({'error': 'User is not authenticated'}, status=401)
            if not content:
                return Response({'error': 'content is required'}, status=400)
            if not topic:
                return Response({'error': 'Topic ID is required'}, status=400)
            
            # 獲取 User 實例
            try:
                user_instance = User.objects.get(id=user)
            except User.DoesNotExist:
                return Response({'error': f'User with ID {user} not found'}, status=404)

            # 檢查 Topic 是否存在
            try:
                topic_instance = Topic.objects.get(id=topic, deleted_at__isnull=True)
            except Topic.DoesNotExist:
                return Response({'error': 'Topic not found'}, status=404)
            
            # 檢查該 Topic 的 Quiz 是否屬於該使用者
            if topic_instance.quiz_topic.user != user_instance:
                return Response({
                    'error': f'You can only favorite topics from your own quizzes,你是{user_instance.username} , 不是{topic_instance.quiz_topic.user.username}'
                }, status=403)
            
            # 檢查是否已經收藏過
            existing_favorite = UserFavorite.objects.filter(
                user=user_instance,
                topic=topic_instance,
                deleted_at__isnull=True
            ).first()
            if existing_favorite:
                return Response({'message': 'This topic is already in your favorites'}, status=200) 

            # 先創建 Note 實例
            note_instance = Note.objects.create(
                quiz_topic=topic_instance.quiz_topic,
                topic=topic_instance,  # 設定 topic 欄位
                title=topic_instance.title,
                user=user_instance,
                content=content,
                is_retake=False
            )
            
            # 然後創建 UserFavorite 實例  note id
            user_favorite = UserFavorite.objects.create(
                user=user_instance,
                topic=topic_instance,
                note=note_instance,
                quiz=topic_instance.quiz_topic
            )

            # 序列化返回資料
            serializer = UserFavoriteSerializer(user_favorite)
            return Response(serializer.data, status=201)
        except Exception as e:
            return Response({'error': f'Internal server error: {str(e)}'}, status=500)

class ChatViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """獲取聊天記錄"""
        try:
            topic_id = request.GET.get('topic_id')
            user_id = request.GET.get('user_id')
            
            if not topic_id:
                return Response({'error': 'topic_id is required'}, status=400)
            
            # 構建查詢條件
            filters = {'topic_id': topic_id, 'deleted_at__isnull': True}
            if user_id:
                filters['user_id'] = user_id
            
            # 獲取聊天記錄，按時間排序
            chats = Chat.objects.filter(**filters).order_by('created_at')
            
            # 序列化並返回
            serializer = ChatSerializer(chats, many=True)
            return Response({
                'topic_id': topic_id,
                'chat_history': serializer.data,
                'total_messages': chats.count()
            }, status=200)
            
        except Exception as e:
            return Response({
                'error': f'Internal server error: {str(e)}'
            }, status=500)

    def post(self, request):
        """處理聊天訊息"""
        try:
            print(f"~~~~~ Django 收到的請求資料: {request.data} ~~~~~")
            
            # 檢查必要欄位是否存在
            user_id = request.data.get('user_id')
            topic_id = request.data.get('topic_id')
            content = request.data.get('content') or request.data.get('message')
            
            if not user_id:
                return Response({'error': 'user_id is required'}, status=400)
            if not topic_id:
                return Response({'error': 'topic_id is required'}, status=400)
            if not content:
                return Response({'error': 'content or message is required'}, status=400)
            
            # 驗證用戶和主題存在
            from myapps.Authorization.models import User
            try:
                user_instance = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': f'User with ID {user_id} not found'
                }, status=400)
            
            try:
                topic_instance = Topic.objects.get(id=topic_id, deleted_at__isnull=True)
            except Topic.DoesNotExist:
                return Response({
                    'error': f'Topic with ID {topic_id} not found'
                }, status=404)
            
            # 1. 先儲存用戶訊息
            user_chat = Chat.objects.create(
                user=user_instance,
                topic=topic_instance,
                content=content,
                sender='user'
            )
            
            # 2. 獲取歷史對話記錄用於 AI 思考
            chat_history = Chat.objects.filter(
                topic=topic_instance, 
                deleted_at__isnull=True
            ).order_by('created_at').values('content', 'sender')
            
            # 準備傳送給 Flask 的資料，包含歷史對話
            topic_data = {
                'id': topic_instance.id,
                'title': topic_instance.title,
                'option_A': topic_instance.option_A,
                'option_B': topic_instance.option_B,
                'option_C': topic_instance.option_C,
                'option_D': topic_instance.option_D,
                'Ai_answer': topic_instance.Ai_answer,
                'explanation_text': topic_instance.explanation_text
            }

            flask_data = {
                'user_id': user_id,
                'topic_id': topic_id,
                'topic_data': topic_data,
                'content': content,
                'chat_history': list(chat_history)  # 包含歷史對話供 AI 參考
            }
            
            print(f"~~~~~ 傳送給 Flask 的資料: {flask_data} ~~~~~")
            
            # 3. 傳給 Flask 做處理
            flask_response = requests.post(
                f'{FLASK_BASE_URL}/api/chat',
                json=flask_data
            )
        
            # 檢查 Flask 響應狀態
            if flask_response.status_code not in [200, 201]:
                return Response({
                    'error': f'Flask service error: {flask_response.status_code}',
                    'details': flask_response.text
                }, status=500)
            
            result = flask_response.json()
            print(f"~~~~~ Flask 回傳的資料: {result} ~~~~~")
            
            # 4. 儲存 AI 回應
            ai_chat = Chat.objects.create(
                user=user_instance,
                topic=topic_instance,
                content=result.get('response', ''),
                sender='ai'
            )
            
            # 5. 返回雙方的訊息
            return Response({
                'user_message': ChatSerializer(user_chat).data,
                'ai_response': ChatSerializer(ai_chat).data,
                'conversation_id': topic_id
            }, status=201)
            
        except requests.exceptions.ConnectionError:
            return Response({
                'error': 'Cannot connect to Flask service. Make sure it is running on port 5000.'
            }, status=503)
        except Exception as e:
            return Response({
                'error': f'Internal server error: {str(e)}'
            }, status=500)

class ChatContentToNoteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self,request):
        """加入單一對話至NOTE"""
        try:
            # 前端回傳 chat  user 目前題目topic_id
            chat_id = request.data.get('chat_id')
            user_id = request.data.get('user_id')
            topic_id = request.data.get('topic_id')
            
            # 驗證必要參數
            if not chat_id:
                return Response({'error': 'chat_id is required'}, status=400)
            if not user_id:
                return Response({'error': 'user_id is required'}, status=400)
            if not topic_id:
                return Response({'error': 'topic_id is required'}, status=400)
            
            # 確認是否已經加入過收藏 如果加入過直接把對話加入到note.content後面
            try:
                user_instance = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'error': f'User with ID {user_id} not found'
                }, status=400)
            try:
                topic_instance = Topic.objects.get(id=topic_id)
            except Topic.DoesNotExist:
                return Response({
                    'error': f'Topic with ID {topic_id} not found'
                }, status=400)
            try:
                chat_instance = Chat.objects.get(id=chat_id)
            except Chat.DoesNotExist:
                return Response({
                    'error': f'Chat with ID {chat_id} not found'
                }, status=400)
            
            try:
                note_instance = Note.objects.get(user=user_instance, quiz_topic=topic_instance.quiz_topic, topic=topic_instance)
            except Note.DoesNotExist:
                ai_answer_text = getattr(topic_instance, f"option_{topic_instance.Ai_answer}", "選項不存在")
                serializer = NoteSerializer(data={
                    "quiz_topic": topic_instance.quiz_topic.id,
                    "topic": topic_instance.id,
                    "user": user_instance.id,
                    "explanation_text": topic_instance.explanation_text,
                    "content": f"題目: {topic_instance.title}\n正確答案: {ai_answer_text}\n解析: {topic_instance.explanation_text}\n=== 聊天記錄 ===\n{chat_instance.content}",
                    "is_retake": False
                })
                serializer.is_valid(raise_exception=True)
                note_instance = serializer.save()
            return Response({
                "message": "Chat added to note successfully.",
                "note_id": note_instance.id
            }, status=200)
            
        except Exception as e:
            return Response({
                'error': f'Internal server error: {str(e)}'
            }, status=500)


# 編輯筆記內容
class NoteEdit(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, note_id):
        """編輯筆記內容或搬移筆記"""
        try:
            # 檢查是否為搬移筆記請求
            quiz_topic_id = request.data.get('quiz_topic_id')
            if quiz_topic_id is not None:
                # 搬移筆記到新主題
                try:
                    note_instance = Note.objects.get(
                        id=note_id,
                        user=request.user,
                        deleted_at__isnull=True
                    )
                except Note.DoesNotExist:
                    return Response({'error': f'Note with ID {note_id} not found'}, status=404)
                
                # 檢查新主題是否存在
                try:
                    new_quiz_topic = Quiz.objects.get(
                        id=quiz_topic_id,
                        deleted_at__isnull=True
                    )
                except Quiz.DoesNotExist:
                    return Response({'error': f'Quiz topic with ID {quiz_topic_id} not found'}, status=404)
                
                # 更新筆記的主題
                note_instance.quiz_topic = new_quiz_topic
                note_instance.updated_at = timezone.now()
                note_instance.save()
                
                return Response({
                    'message': 'Note moved successfully',
                    'note_id': note_instance.id,
                    'new_quiz_topic_id': quiz_topic_id
                }, status=200)
            
            # 原有的編輯筆記內容邏輯
            new_content = request.data.get('content')
            new_title = request.data.get('title')
            if not new_content:
                return Response({'error': 'content is required'}, status=400)
            if not new_title:
                return Response({'error': 'title is required'}, status=400)
            try:
                note_instance = Note.objects.get(
                    id=note_id,
                    user=request.user,
                    deleted_at__isnull=True
                )
            except Note.DoesNotExist:
                return Response({'error': f'Note with ID {note_id} not found'}, status=404)

            # 簡單直接更新，不使用 select_for_update 和複雜的序列化
            note_instance.title = new_title
            note_instance.content = new_content
            note_instance.updated_at = timezone.now()
            note_instance.save()

            return Response({
                'message': 'Note updated successfully',
                'note_id': note_instance.id,
                'title': note_instance.title,
                'content': note_instance.content
            }, status=200)

        except Exception as e:
            return Response({'error': f'Internal server error: {str(e)}'}, status=500)
        
    # 軟刪除
    def delete(self , request, note_id):
        try:
            note_instance = Note.objects.get(
                id=note_id,
                deleted_at__isnull=True
            )
            if note_instance:
                note_instance.deleted_at = timezone.now()
                note_instance.save()
                return Response({'message': 'Note deleted successfully'}, status=204)
        except Note.DoesNotExist:
            return Response({'error': f'Note with ID {note_id} not found'}, status=404)

class NoteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """獲取使用者的所有筆記"""
        try:
            if 'quiz_topic' in request.data:
                quiz_topic = request.data.get('quiz_topic')
                notes = Note.objects.filter(
                    quiz_topic=quiz_topic,
                    user=request.user,
                    deleted_at__isnull=True,
                    quiz_topic__deleted_at__isnull=True
                ).order_by('-created_at')  # 按創建時間倒序排列
            else:
                # 使用 filter 而不是 get，獲取多個筆記
                notes = Note.objects.filter(
                    user=request.user,
                    deleted_at__isnull=True,
                    quiz_topic__deleted_at__isnull=True
                ).order_by('-created_at')  # 按創建時間倒序排列
            
            return Response({
                'notes': NoteSerializer(notes, many=True).data,
                'count': notes.count()
            }, status=200)
            
        except Exception as e:
            return Response({
                'error': f'Error fetching notes: {str(e)}'
            }, status=500)
    
    # 手動新增空白筆記
    def post(self, request):
        try:
            title = request.data.get('title')
            quiz_topic = request.data.get('quiz_topic')
            content = request.data.get('content')
            if not quiz_topic or not content:
                return Response({'error': 'quiz_topic and content are required'}, status=400)
            
            try:
                quiz_topic_instance = Quiz.objects.get(id=quiz_topic, deleted_at__isnull=True)
            except Quiz.DoesNotExist:
                return Response({'error': f'Quiz with ID {quiz_topic} not found'}, status=404)

            # 創建新的 Note
            note = Note.objects.create(
                user=request.user,
                title=title,
                quiz_topic=quiz_topic_instance,
                topic=None,  # 手動新增的筆記沒有關聯的題目
                content=content
            )
            return Response({
                'message': 'Note created successfully',
                'note_id': note.id
            }, status=201)

        except Exception as e:
            return Response({'error': f'Internal server error: {str(e)}'}, status=500)


class CreateQuizTopicView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 創建新的 QuizTopic (自創筆記的部分)
        try:
            # 從請求中獲取 quiz_topic 名稱
            quiz_topic_name = request.data.get('quiz_topic')
            user = request.user
            if not quiz_topic_name:
                return Response({'error': 'quiz_topic is required'}, status=400)

            #檢查使用者是否有建立過Quiz
            user_quiz = Quiz.objects.filter(user=user, quiz_topic=quiz_topic_name, deleted_at__isnull=True).first()
            if user_quiz:
                print(f"使用者 {user.username} 已經有 Quiz: {user_quiz.quiz_topic}")
                return Response({'error': f'Quiz with topic "{quiz_topic_name}" already exists'}, status=400)

            # 創建新的 QuizTopic
            serializer = QuizSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            quiz_topic_instance = serializer.save(user=user)  # 在保存時設定 user

            # 為新創建的 QuizTopic 添加收藏
            add_favor = UserFavorite.objects.create(user=user, quiz_id=quiz_topic_instance.id)

            return Response({
                "message": "QuizTopic created successfully.",
                "quiz_topic_id": quiz_topic_instance.id
            }, status=201)
        except Exception as e:
            return Response({'error': f'Internal server error: {str(e)}'}, status=500)

class UserQuizView(APIView):
    permission_classes = [IsAuthenticated]
    # 取得所有 有在收藏的Quiz 
    def get(self, request):
        favorites = UserFavorite.objects.filter(user=request.user)
        print(f"=== 使用者 {request.user.username} 的收藏數量: {favorites.count()} ===")
        quiz_ids = favorites.values_list('topic__quiz_topic', flat=True).distinct()
        quizzes = Quiz.objects.filter(id__in=quiz_ids, deleted_at__isnull=True).order_by('-created_at')
        print(f"找到 {quizzes.count()} 個 Quiz")
        serializer = QuizSimplifiedSerializer(quizzes, many=True)
        return Response(serializer.data)

class RetestView(APIView):
    permission_classes = [IsAuthenticated]
    # 在下重新測驗後 筆記內容傳至flask  GPT處理整理筆記內容 再由用戶選擇難度 題數重新測驗
    def post(self, request):
        note_id = request.data.get("note_id")
        if not note_id:
            return Response({'error': 'note_id is required'}, status=400)
        
        # 查出要重測的用戶筆記內容
        note = get_object_or_404(
            Note.objects.select_related("quiz_topic"), id=note_id,
            user=request.user,
            deleted_at__isnull=True,
            quiz_topic__deleted_at__isnull=True
        )
        # 資料傳輸給flask
        note_data = NoteSerializer(note).data
        try:
            response = requests.post(
                f'{FLASK_BASE_URL}/api/retest',
                json=note_data
            )
            if response.status_code == 200:
                flask_data = response.json()
                raw_content = flask_data.get('content', '')
                
                # 解析 Flask 回傳的 JSON 字串
                try:
                    import json
                    # 嘗試解析 GPT 回傳的 JSON 格式
                    parsed_content = json.loads(raw_content)
                    if isinstance(parsed_content, list) and len(parsed_content) > 0:
                        # 提取實際的 content
                        processed_content = parsed_content[0].get('content', raw_content)
                    else:
                        processed_content = raw_content
                except (json.JSONDecodeError, AttributeError, KeyError):
                    # 如果解析失敗，直接使用原始內容
                    processed_content = raw_content
                
                note.is_retake = True
                # 只更新is_retake欄位
                note.save(update_fields=['is_retake'])
                
                return Response({
                    'message': 'Re-testing successful', 
                    'original_content': note.content,
                    'processed_content': processed_content,
                    'raw_flask_response': flask_data
                })
            else:
                return Response({'error': f'Error occurred while re-testing: {response.text}'}, status=response.status_code)

        except Exception as e:
            return Response({'error': f'Error fetching notes: {str(e)}'}, status=500)


# GPT 解析題目
# 目前整合在一起 暫時保留
# -----------------------------------
class ParseAnswerView(APIView):
    permission_classes = [IsAuthenticated]
    # 輸入要解析的題目&答案
    def post(self, request):
        topic_id = request.data.get("topic_id")
        if not topic_id:
            return Response({'error': 'topic_id is required'}, status=400)
        topic = get_object_or_404(Topic, id=topic_id, deleted_at__isnull=True)

        title = topic.title
        Ai_answer = topic.Ai_answer
        option_A = topic.option_A
        option_B = topic.option_B
        option_C = topic.option_C
        option_D = topic.option_D

        def switch(Ai_answer):
            if Ai_answer == 'A':
                return option_A
            elif Ai_answer == 'B':
                return option_B
            elif Ai_answer == 'C':
                return option_C
            elif Ai_answer == 'D':
                return option_D
            else:
                return "選項不存在"

        # 傳給flask處理 解析
        flask_data = {
            "title": title,
            "Ai_answer": switch(Ai_answer),
        }
        print(f"傳送給 Flask 的資料: {flask_data}")
        try:
            response = requests.post(
                f'{FLASK_BASE_URL}/api/parse_answer',
                json=flask_data
            )
            if response.status_code != 200:
                return Response({'error': f'Error occurred while parsing: {response.text}'}, status=response.status_code)
            flask_data.update(response.json())
            return Response({"message": "Parsing successful", "data": flask_data}, status=200)
        except Exception as e:
            return Response({'error': f'Error occurred while parsing: {str(e)}'}, status=500)
        
# -----------------------------------
# 目前整合在一起 暫時保留
# GPT 解析題目


# 取得用戶的所有quiz 和 note
class UsersQuizAndNote(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # 取得該用戶所有有效收藏
        favorites = UserFavorite.objects.filter(user=user, deleted_at__isnull=True)
        # 取得所有被收藏的主題（quiz）
        favor_quiz = Quiz.objects.filter(id__in=favorites.values_list('quiz_id', flat=True), deleted_at__isnull=True)

        quiz_ids = favorites.values_list('quiz_id', flat=True).distinct()
        quizzes = Quiz.objects.filter(id__in=quiz_ids, deleted_at__isnull=True).order_by('-created_at')
        
        topic_data = QuizSimplifiedSerializer(quizzes, many=True).data


        # 取得這些主題的筆記（Note）- 修改為獲取所有屬於收藏主題的筆記，而不僅僅是收藏的筆記
        favor_notes = Note.objects.filter(
            quiz_topic__in=quizzes,  # 屬於收藏主題的筆記
            user=user, 
            deleted_at__isnull=True
        )

        note_data = NoteSimplifiedSerializer(favor_notes, many=True).data

        return Response({
            'favorite_quiz_topics': topic_data,
            'favorite_notes': note_data
        })
    
# 前端回傳 用戶答案
class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        from django.db import transaction
        
        with transaction.atomic():
            user = request.user
            topic_id = request.data.get("topic")
            quiz_topic_id = request.data.get("quiz_topic_id")
            difficulty = request.data.get("difficulty")
            user_answer = request.data.get("user_answer")
            updates = request.data.get("updates", [])
            is_test = request.data.get("is_test", False)  # 前端回傳是否為 TEST 模式
            token = request.META.get("HTTP_AUTHORIZATION", "").split(" ")[1]

            print(f"=== SubmitAnswerView Debug ===")
            print(f"topic_id: {topic_id}")
            print(f"user_answer: {user_answer}")
            print(f"updates: {updates}")
            print(f"updates 長度: {len(updates) if updates else 0}")
            print(f"request.data type: {type(request.data)}")
            print(f"quiz_topic_id {quiz_topic_id}  ===")
            print(f"使用者: {user.id}")
            print(f"題目 ID: {topic_id}")
            print(f"難度: {difficulty}")
            print(f"使用者答案: {user_answer}")
            
            # 處理單一題目更新
            if topic_id and user_answer is not None:
                print("=== 進入單一題目更新分支 ===")
                topic = get_object_or_404(Topic, id=topic_id, deleted_at__isnull=True)
                topic.User_answer = user_answer
                topic.save()
                Ai_answer = topic.Ai_answer
                return Response({"message": "Answer submitted successfully"}, status=201)
                # 計算總題數與正確數

            elif updates:
                print("=== 進入 updates 分支 ===")
                updated_topics = []
                correct_answers = 0
                total_questions = len(updates)
                quiz_topic_id = None
                difficulty_name = None
                
                # 難度 ID 轉英文名稱的對照表
                difficulty_mapping = {
                    1: "beginner",
                    2: "intermediate", 
                    3: "advanced",
                    4: "master",
                    5: "error"
                }
                
                for item in updates:
                    topic = get_object_or_404(Topic, id=item.get("id"), deleted_at__isnull=True)
                    topic.User_answer = item.get("user_answer")
                    topic.save()
                    
                    # 從第一個 topic 抓取 quiz_topic_id 和 difficulty
                    if quiz_topic_id is None:
                        quiz_topic_id = topic.quiz_topic.id  # 使用正確的關聯字段
                        print(f"Topic ID: {topic.id}, difficulty object: {topic.difficulty}")
                        if topic.difficulty:
                            difficulty_id = topic.difficulty.id
                            difficulty_name = difficulty_mapping.get(difficulty_id, "beginner")
                            print(f"Found difficulty_id: {difficulty_id}, mapped to: {difficulty_name}")
                        else:
                            difficulty_id = 1
                            difficulty_name = "beginner"
                            print(f"No difficulty found, using default: {difficulty_name}")
                        print(f"Final values - quiz_topic_id: {quiz_topic_id}, difficulty_name: {difficulty_name}")
                    
                    # 使用從資料庫抓出來的 topic.Ai_answer，而不是 item.get("Ai_answer")
                    if item.get("user_answer") == topic.Ai_answer:
                        correct_answers += 1
                    updated_topics.append({
                        "id": topic.id,
                        "Ai_answer": topic.Ai_answer,
                        "User_answer": topic.User_answer,
                        "quiz_topic_id": topic.quiz_topic.id,
                        "difficulty": difficulty_name,
                        "difficulty_id": topic.difficulty.id if topic.difficulty else None,
                        "title": topic.title,
                        "is_correct": item.get("user_answer") == topic.Ai_answer
                    })
                
                # 準備傳送到熟悉度 API 的資料
                payload = {
                    "quiz_topic_id": quiz_topic_id,
                    "difficulty": difficulty_name,
                    "total_questions": total_questions,
                    "correct_answers": correct_answers,
                }
                
                # 判斷是否為 TEST 模式或 error 難度（id=5），直接回傳，不呼叫API
                if is_test or difficulty_id == 5:
                    message = "Test mode - no API call" if is_test else "Error level - no API call"
                    return Response({
                        "message": f"Batch answers submitted successfully ({message})",
                        "total_questions": total_questions,
                        "correct_answers": correct_answers
                    }, status=201)
                
                print(f"=== 傳送到熟悉度 API 的資料 ===")
                print(f"Payload: {payload}")
                
                # 獲取當前請求的 Authorization token
                auth_header = request.META.get('HTTP_AUTHORIZATION', '')
                headers = {}
                if auth_header:
                    headers['Authorization'] = auth_header
                    print(f"Using Authorization header: {auth_header}")
                
                try:
                    response = requests.post(
                        f"{DJANGO_BASE_URL}/api/familiarity/", 
                        json=payload,
                        headers=headers
                    )
                    data = response.json().get("familiarity")
                    print(f"熟悉度 API 回應狀態: {response.status_code}")
                    print(f"熟悉度 API 回應內容: {data}")
                except Exception as e:
                    print(f"呼叫熟悉度 API 失敗: {str(e)}")

                return Response({
                    "message": "Batch answers submitted successfully",
                    "total_questions": total_questions,
                    "correct_answers": correct_answers,
                    "familiarity_api_response": data
                }, status=201)
            
            # 處理直接傳陣列的格式 [{"id": 276, "user_answer": "A"}]
            elif isinstance(request.data, list):
                updated_topics = []
                correct_answers = 0
                total_questions = len(request.data)
                quiz_topic_id = None
                difficulty_name = None
                
                # 難度 ID 轉英文名稱的對照表
                difficulty_mapping = {
                    1: "beginner",
                    2: "intermediate", 
                    3: "advanced",
                    4: "master",
                    5: "error"
                }
                
                for item in request.data:
                    topic = get_object_or_404(Topic, id=item.get("id"), deleted_at__isnull=True)
                    topic.User_answer = item.get("user_answer")
                    topic.save()
                    
                    # 從第一個 topic 抓取 quiz_topic_id 和 difficulty
                    if quiz_topic_id is None:
                        quiz_topic_id = topic.quiz_topic.id  # 使用正確的關聯字段
                        difficulty_id = topic.difficulty.id if topic.difficulty else 1
                        difficulty_name = difficulty_mapping.get(difficulty_id, "beginner")
                    
                    # 使用從資料庫抓出來的 topic.Ai_answer
                    if item.get("user_answer") == topic.Ai_answer:
                        correct_answers += 1
                    updated_topics.append({
                        "id": topic.id,
                        "Ai_answer": topic.Ai_answer,
                        "User_answer": topic.User_answer,
                        "quiz_topic_id": topic.quiz_topic.id,
                        "difficulty": difficulty_name,
                        "title": topic.title,
                        "is_correct": item.get("user_answer") == topic.Ai_answer
                    })
                
                # 準備傳送到熟悉度 API 的資料
                payload = {
                    "quiz_topic_id": quiz_topic_id,
                    "difficulty": difficulty_name,
                    "total_questions": total_questions,
                    "correct_answers": correct_answers,
                }
                
                # 判斷是否為 TEST 模式或 error 難度（id=5），直接回傳，不呼叫API
                if is_test or difficulty_id == 5:
                    message = "Test mode - no API call" if is_test else "Error level - no API call"
                    return Response({
                        "message": f"Batch answers submitted successfully ({message})",
                        "total_questions": total_questions,
                        "correct_answers": correct_answers
                    }, status=201)
                
                print(f"=== 傳送到熟悉度 API 的資料 (List格式) ===")
                print(f"Payload: {payload}")
                
                try:
                    response = requests.post(f"{DJANGO_BASE_URL}/api/familiarity/", json=payload)
                    data = response.json().get("familiarity")
                    print(f"熟悉度 API 回應狀態: {response.status_code}")
                    print(f"熟悉度 API 回應內容: {data}")
                except Exception as e:
                    print(f"呼叫熟悉度 API 失敗: {str(e)}")
                
                return Response({
                    "message": "Batch answers submitted successfully",
                    "total_questions": total_questions,
                    "correct_answers": correct_answers,
                    "familiarity_api_response": data
                }, status=201)
            
            else:
                return Response({"error": "Either 'topic' and 'user_answer' or 'updates' are required"}, status=400)

class NoteEditQuizTopicView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, note_id):
        try:
            # 從請求中獲取新的 quiz_topic ID
            user=request.user
            new_quiz_topic_id = request.data.get("quiz_topic_id")
            if not new_quiz_topic_id:
                return Response({"error": "quiz_topic_id is required"}, status=400)

            # 確認新的 quiz_topic 是否存在
            new_quiz_topic = get_object_or_404(Quiz, id=new_quiz_topic_id, user=user)

            # 獲取要修改的筆記
            note = get_object_or_404(Note, id=note_id, user=user, deleted_at__isnull=True)

            # 更新筆記的 quiz_topic
            note.quiz_topic = new_quiz_topic
            note.save()

            print(f"Updated topics for note {note.id}: {note.quiz_topic} -> {new_quiz_topic}")

            # 同步更新所有與該 Note 關聯的 Topic 的 topic
            topic = Topic.objects.filter(id=note.topic.id, deleted_at__isnull=True).update(quiz_topic=new_quiz_topic)


            return Response({"message": "Note and related topics topic updated successfully"}, status=200)
        except Exception as e:
            return Response({"error": f"Internal server error: {str(e)}"}, status=500)